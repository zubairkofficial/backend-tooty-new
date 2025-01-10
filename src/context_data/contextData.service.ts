import { Logger } from '@nestjs/common';
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

import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { unlink } from 'fs';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';

export class ContextDataService {
    constructor(
        private readonly logger = new Logger()) { }


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
            throw new Error('error fetching file by subject')
        }
    }

    async getAllFilesBySchool(req: any, page?: number, limit?: number) {

        console.log('req user:', req.user, page, limit);
        try {
            let files;
            let totalCount;
            let totalPages;

            if (page && limit) {
                // Pagination logic
                const offset = (page - 1) * limit;
                const result = await File.findAndCountAll({
                    where: {
                        school_id: req.user.school_id, // Filter files by user ID
                    },
                    limit,
                    offset,
                });
                files = result.rows;
                totalCount = result.count;
                totalPages = Math.ceil(totalCount / limit);
            } else {
                // Return all files if page and limit are not provided
                files = await File.findAll({
                    where: {
                        school_id: req.user.school_id, // Filter files by user ID
                    },
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
            throw new Error('Error fetching files');
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
            throw new Error('Failed Deleting File')
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

    async processFile(file: Express.Multer.File,
        createFileDto: CreateFileDto,
        req: any,
        onProgress: (progress: number) => void,) {

        console.log('req user:', req.user);
        console.log('File received:', file.originalname, createFileDto.file_name);

        if (!file.originalname.endsWith('.pdf')) {
            throw new Error('Only PDF files are supported');
        }

        const api = await SuperAdminProfile.findOne({
            attributes: ['openai']
        });
        if (!api) {
            throw new Error('Unable to find API key');
        }

        const api_key = api.openai;

        if (api_key) {

            // 1. Load PDF
            const loader = new PDFLoader(file.path, {
                splitPages: false
            });

            const singleDoc = await loader.load();

            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 0,
            });

            const docs = await textSplitter.createDocuments([singleDoc[0].pageContent]);


            console.log("docs", docs.length)
            const embeddings = new OpenAIEmbeddings({
                apiKey: api_key,
                model: process.env.OPEN_AI_EMBEDDING_MODEL,
                dimensions: 1536,
            });
            // 4. Connect to PgVectorStore
            // Initialize Sequelize
            // Sample config
            const config = {
                postgresConnectionOptions: {
                    type: "postgres",
                    host: `${process.env.DB_HOST}`,

                    password: `${process.env.DB_PASSWORD}`,
                    database: `${process.env.DB_NAME}`,

                    port: Number(`${process.env.DB_PORT}`),
                    user: `${process.env.DB_USERNAME}`,

                } as PoolConfig,
                tableName: "vector_data",
                columns: {
                    idColumnName: "id",
                    vectorColumnName: "vector",
                    contentColumnName: "content",
                    metadataColumnName: "metadata",

                },
                // supported distance strategies: cosine (default), innerProduct, or euclidean
                distanceStrategy: "cosine" as DistanceStrategy,
            };



            const vectorStore = await PGVectorStore.initialize(embeddings, config);



            const context_file = await File.create({
                file_name: createFileDto.file_name,
                slug: createFileDto.slug,
                user_id: req.user.sub,
                subject_id: Number(createFileDto.subject_id),
                school_id: req.user.school_id
            });

            const docsWithFileId = docs.map((doc) => (
                {
                    ...doc,
                    metadata: {
                        file_id: context_file?.id,
                        school_id: req.user.school_id
                    }

                }
            ))

            const splittedDocs = this.splitIntoTenPercentParts(docsWithFileId)

            // console.log("res", docs)
            try {
                const totalChunks = splittedDocs.length;
                let processedChunks = 0;

                const promises = splittedDocs.map(async (chunkArray: Document[], index) => {

                    const ids = chunkArray.map(() => uuidv4())

                    await vectorStore.addDocuments(chunkArray, { ids });


                    // Update progress
                    processedChunks++;
                    const progress = Math.round((processedChunks / totalChunks) * 100);
                    await File.update({
                        processed: Number(progress)
                    }, {
                        where: {
                            id: {
                                [Op.eq]: context_file.id
                            }
                        }
                    })
                    if (progress == 100) {
                        console.log("file path", file.path)
                        unlink(file.path, (err) => {
                            if (err) {
                                console.error(`Error deleting file: ${err.message}`);
                            } else {
                                console.log('File deleted successfully');
                            }
                        });
                    }
                    onProgress(progress);
                });

                await Promise.all(promises);

            } catch (error) {
                console.log("file path", file.path)
                unlink(file.path, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${err.message}`);
                    } else {
                        console.log('File deleted successfully');
                    }
                });
                console.error('Error adding to vector store :', error);
                throw new Error('Error creating context data');
            }
        }
    }
}
