import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CreateFileDto, DeleteFileDto, GetFilesBySubjectDto } from './dto/create-contextData.dto';
import { File } from './entities/file.entity';
import { Op } from 'sequelize';
import { Request } from 'express';
import { Join_BotContextData } from 'src/bot/entities/join_botContextData.entity';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { v4 as uuidv4 } from "uuid";
import {
    PGVectorStore,
    DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";
import { Pool, PoolConfig } from "pg";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as nodemailer from 'nodemailer';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { unlink } from 'fs';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { promisify } from 'util';
import axios from 'axios'
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
export class ContextDataService {
    constructor(
        private readonly logger = new Logger(),
        private unlinkAsync = promisify(unlink)
    ) { }


    async getFilesBySubject(getFileBySubjectDto: GetFilesBySubjectDto, req: any) {

        try {

            const files = await File.findAll(
                {
                    where: {
                        subject_id: {
                            [Op.eq]: getFileBySubjectDto.subject_id
                        }
                    }
                }
            )

            return {
                statusCode: 200,
                files: files,
                message: "success getting files"
            }
        } catch (error) {
            throw new HttpException(error.message || 'Error fetching file by subject', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllFiles(req: any, page?: number, limit?: number) {

        console.log('req user:', req.user, page, limit);
        try {
            let files;
            let totalCount;
            let totalPages;

            if (page && limit) {
                // Pagination logic
                const offset = (page - 1) * limit;
                const result = await File.findAndCountAll({

                    include: [{
                        model: Subject,
                        attributes: ["title"],
                        include: [{
                            model: Level,
                            as: 'level'
                        }]
                    }],
                    limit,
                    offset,
                });
                files = result.rows;
                totalCount = result.count;
                totalPages = Math.ceil(totalCount / limit);
            } else {
                // Return all files if page and limit are not provided
                files = await File.findAll({

                    include: [{
                        model: Subject,
                        attributes: ["title"],
                        include: [{
                            model: Level,
                            as: 'level'
                        }]

                    }],
                });
                totalCount = files.length;
                totalPages = 1; // No pagination, so totalPages is 1
            }

            return {
                statusCode: 200,
                files,
                totalCount,
                totalPages,
                currentPage: page || 1, // Default to page 1 if not provided
                message: 'Successfully fetched files',
            };
        } catch (error) {
            throw new HttpException(error.message || 'Error fetching files', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async deleteFile(deleteFileDto: DeleteFileDto, req: Request) {

        const pool = new Pool({

            host: `${process.env.DB_HOST}`,

            password: `${process.env.DB_PASSWORD}`,
            database: `${process.env.DB_NAME}`,

            port: Number(`${process.env.DB_PORT}`),
            user: `${process.env.DB_USERNAME}`,


        });
        const client = await pool.connect();
        try {
            const file_attached = await Join_BotContextData.findOne({
                where: {
                    file_id: {
                        [Op.eq]: deleteFileDto.id
                    }
                }
            })

            if (file_attached) {
                throw new Error("Delete Failed: File is in Use")
            }

            const res = await File.destroy({
                where: {
                    id: {
                        [Op.eq]: deleteFileDto.id
                    }
                }
            }).then(async () => {


                const query = `DELETE FROM vector_data WHERE metadata->>'file_id' = $1`;
                const params = [deleteFileDto.id];

                await client.query(query, params);


                await Join_BotContextData.destroy({
                    where: {
                        file_id: {
                            [Op.eq]: deleteFileDto.id
                        }
                    }
                })

            }).then(result => {
                console.log("sucees",);
                client.release()
                return {
                    statusCode: 200,
                    message: "File and Context data deleted successfully"
                }
            })


            return res
        } catch (error) {
            client.release()
            throw new HttpException(error.message || 'Failed Deleting File', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    splitIntoTenPercentParts(array: any[]) {
        const tenPercentLength = Math.ceil(array.length * 0.1); // Calculate 10% length
        const splittedArray = [];

        for (let i = 0; i < array.length; i += tenPercentLength) {
            const part = array.slice(i, i + tenPercentLength); // Slice the next 10% part
            splittedArray.push(part); // Add the part to the result
        }

        return splittedArray;
    }


    async fileDelete(filePath: string): Promise<void> {
        try {
            await this.unlinkAsync(filePath);
            console.log(`File deleted successfully: ${filePath}`);
        } catch (err) {
            console.error(`Error deleting file ${filePath}: ${err.message}`);
        }
    }

    async validateOpenAIKeyWithLangChain(apiKey: string): Promise<boolean> {
        try {
            const model = new ChatOpenAI({
                openAIApiKey: apiKey,
                temperature: 0,
            });

            // Perform a minimal test query
            const response = await model.invoke('Validate OpenAI API key');
            return !!response;
        } catch (error) {
            console.log("error open ai key", error.message)
            const transporter = nodemailer.createTransport({
                host: `${process.env.EMAIL_HOST}`,
                port: Number(`${process.env.EMAIL_PORT}`),
                secure: false,
                auth: {
                    user: `${process.env.EMAIL_USERNAME}`,
                    pass: `${process.env.EMAIL_PASSWORD}`,
                },
            });

            // Send email
            await transporter.sendMail({
                from: `${process.env.EMAIL_FROM_ADDRESS}`,
                to: "noreply@tooty.ai", // Use the provided email
                subject: 'Your Open AI API key at Tooty',
                text: `This is auto generated Email, There is a problem with OpenAI API key 
                \n
                the raw error is here ${error.message}
                
                `
            });

            return false;

        }
    }

    async processFile(
        file: Express.Multer.File,
        createFileDto: CreateFileDto,
        req: any,
        onProgress: (progress: number) => void,
    ) {
        console.log('req user:', req.user);
        console.log('File received:', file.originalname, createFileDto.file_name);

        // Validate file type
        if (!file.originalname.endsWith('.pdf')) {
            onProgress(-1); // Indicate error to the caller
            await this.fileDelete(file.path); // Use fileDelete
            throw new Error('Only PDF files are supported');
        }

        try {
            // Fetch API key
            const api = await SuperAdminProfile.findOne({
                attributes: ['openai'],
            });
            if (!api || !api.openai) {
                onProgress(-1);
                await this.fileDelete(file.path); // Use fileDelete
                throw new Error('API key is missing or not found');
            }

            const api_key = api.openai;

            // Validate API key
            const isKeyValid = await this.validateOpenAIKeyWithLangChain(api_key);
            if (!isKeyValid) {
                onProgress(-1);
                await this.fileDelete(file.path);
                throw new Error('The OpenAI API key is invalid or expired. Please update the key.');
            }

            // 1. Load PDF
            const loader = new PDFLoader(file.path, {
                splitPages: false,
            });

            let singleDoc;
            try {
                singleDoc = await loader.load();
            } catch (error) {
                console.error('Error loading PDF:', error);
                onProgress(-1);
                await this.fileDelete(file.path); // Use fileDelete
                throw new Error('Failed to parse PDF. Ensure the PDF contains selectable text.');
            }

            // 2. Split text into chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 0,
            });

            let docs;
            try {
                docs = await textSplitter.createDocuments([singleDoc[0].pageContent]);
            } catch (error) {
                console.error('Error splitting PDF:', error);
                onProgress(-1);
                await this.fileDelete(file.path); // Use fileDelete
                throw new HttpException(error.message || 'Failed to split PDF. Ensure the PDF contains selectable text.', HttpStatus.FAILED_DEPENDENCY);
            }

            console.log('Total docs:', docs.length);

            // 3. Initialize embeddings
            const embeddings = new OpenAIEmbeddings({
                apiKey: api_key,
                model: process.env.OPEN_AI_EMBEDDING_MODEL,
                dimensions: 1536,
            });

            // 4. Connect to PgVectorStore
            const config = {
                postgresConnectionOptions: {
                    type: 'postgres',
                    host: process.env.DB_HOST,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    port: Number(process.env.DB_PORT),
                    user: process.env.DB_USERNAME,
                } as PoolConfig,
                tableName: 'vector_data',
                columns: {
                    idColumnName: 'id',
                    vectorColumnName: 'vector',
                    contentColumnName: 'content',
                    metadataColumnName: 'metadata',
                },
                distanceStrategy: 'cosine' as DistanceStrategy,
            };

            let vectorStore;
            try {
                vectorStore = await PGVectorStore.initialize(embeddings, config);
            } catch (error) {
                console.error('Error initializing vector store:', error);
                onProgress(-1);
                await this.fileDelete(file.path); // Use fileDelete
                throw new Error('Failed to initialize vector store.');
            }

            // 5. Create file record in the database
            let context_file;
            try {
                context_file = await File.create({
                    file_name: createFileDto.file_name,
                    slug: createFileDto.slug + "-" + new Date(),
                    user_id: req.user.sub,
                    subject_id: Number(createFileDto.subject_id),

                });
            } catch (error) {
                console.error('Error creating file record:', error);
                onProgress(-1);
                await this.fileDelete(file.path); // Use fileDelete
                throw new Error('Failed to create file record in the database.');
            }

            // 6. Add metadata to docs
            const docsWithFileId = docs.map((doc) => ({
                ...doc,
                metadata: {
                    file_id: context_file?.id,

                },
            }));

            // 7. Process chunks
            const splittedDocs = this.splitIntoTenPercentParts(docsWithFileId);

            try {
                const totalChunks = splittedDocs.length;
                let processedChunks = 0;

                const promises = splittedDocs.map(async (chunkArray: Document[], index) => {
                    const ids = chunkArray.map(() => uuidv4());

                    try {
                        await vectorStore.addDocuments(chunkArray, { ids });
                    } catch (error) {
                        console.error('Error adding documents to vector store:', error);
                        throw error;
                    }

                    processedChunks++;
                    const progress = Math.round((processedChunks / totalChunks) * 100);

                    try {
                        await File.update(
                            { processed: Number(progress) },
                            { where: { id: { [Op.eq]: context_file.id } } }
                        );
                    } catch (error) {
                        console.error('Error updating progress:', error);
                    }

                    if (progress === 100) {
                        await this.fileDelete(file.path); // Use fileDelete
                    }

                    onProgress(progress);
                });

                await Promise.all(promises);
            } catch (error) {
                console.error('Error processing chunks:', error);
                onProgress(-1);
                throw new Error('Error creating context data.');
            }
        } catch (error) {
            console.error('Unhandled error:', error);
            await this.fileDelete(file.path); // Use fileDelete
            throw new HttpException(error.message || 'Error processing file', HttpStatus.INTERNAL_SERVER_ERROR);
        }


    }
}
