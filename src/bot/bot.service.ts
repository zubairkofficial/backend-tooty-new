import { HttpStatus, Logger, HttpException, Injectable } from "@nestjs/common";
import { CreateBotDto, DeleteBotDto, GetBotByLevelSubject, GetBotBySubjectDto, GetBotDto, QueryBot, UpdateBotDto } from "./dto/create-bot.dto";
import { Bot } from "./entities/bot.entity";
import { CreateBotContextDto, DeleteBotContextDto, GetBotContextDto, UpdateBotContextDto } from "./dto/create-Join-bot-data.dto";
import { Join_BotContextData } from "./entities/join_botContextData.entity";
import { OpenAIEmbeddings, DallEAPIWrapper, ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { Response } from "express";
import * as nodemailer from 'nodemailer';
import { Chat } from "src/chat/entities/chat.entity";
import { GenerateImageDto } from "./dto/generateImage.dto";
import * as path from 'path'
import * as fs from 'fs'
import axios, { HttpStatusCode } from 'axios'
import { ChatService } from "src/chat/chat.service";
import { Op } from "sequelize";
import { ApiService } from "src/api/api.service";
import { JoinTeacherSubjectLevel } from "src/profile/entities/join-teacher-subject-level.entity";
import { TeacherProfile } from "src/profile/entities/teacher-profile.entity";
import { Pool, PoolConfig } from "pg";
import { DistanceStrategy, PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { AIMessage, BaseMessage, HumanMessage, isAIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SuperAdminProfile } from "src/profile/entities/super-admin.entity";
import { File } from "src/context_data/entities/file.entity";
import { Subject } from "src/subject/entity/subject.entity";
import { Sequelize } from "sequelize-typescript";

const retrieveSchema = z.object({ query: z.string() });

const outputSchema = z.object({
    answer: z.string(),
    shouldGenerateImage: z.boolean()
});

@Injectable()
export class BotService {
    private readonly logger = new Logger('BotService')

    constructor(
        private readonly sequelize: Sequelize,
    ) { }

    async generateImage(generateImageDto: GenerateImageDto, req: any) {
        console.log("data from message", generateImageDto)
        let api_key = ""
        try {
            const bot = await Bot.findByPk(generateImageDto.bot_id)
            console.log("bot in bot", bot)

            if (!bot) {
                throw new Error("No bot with this id exist")
            }
            const api = await SuperAdminProfile.findOne({
                attributes: ["dalle"]
            })
            if (!api) {
                throw new Error("unable to find api key")
            }

            api_key = api?.dalle

            if (api_key != "") {


                // Validate API key
                const isKeyValid = await this.validateOpenAIKeyWithLangChain(api_key, "DallE");
                if (!isKeyValid) {
                    throw new Error('The OpenAI API key is invalid or expired. Please update the key.');
                }

                console.log(generateImageDto.answer)
                const tool = new DallEAPIWrapper({
                    n: 1, // Default
                    model: "dall-e-3", // Default
                    apiKey: api_key, // Default
                });

                const imageURL = await tool.invoke(generateImageDto.answer);
                console.log(imageURL)
                const imageSaveResult = await this.downloadImage(imageURL, req, generateImageDto.chat_id)
                console.log("image save url", imageSaveResult)
                if (imageSaveResult == "") {
                    throw new Error("error creating image chat")
                }
                const chat = await Chat.create({
                    is_bot: true,
                    bot_id: generateImageDto.bot_id,
                    message: "",
                    image_url: imageSaveResult,
                    user_id: req.user.sub
                })
                console.log(imageURL)
                return {
                    statusCode: 200,
                    data: chat
                }
            }
        } catch (error) {
            console.log("an error occured while generating image", error)
            throw new HttpException(error.message || "An error occurred while generating image", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async downloadImage(imageUrl: string, req: any, chat_id: number): Promise<string> {
        try {
            console.log("came here 1")
            // Define the save path
            const savePath = path.join(__dirname, '..', '..', 'images');

            console.log("came here 2", savePath)
            // Ensure the chatImages directory exists
            if (!fs.existsSync(savePath)) {
                console.log("came here n")
                fs.mkdirSync(savePath, { recursive: true });
            }

            // Extract the file name from the URL and set the file path
            const fileName = req.user.sub + "-" + chat_id + "-" + Math.random() * 10000 + ".png"

            const filePath = path.join(savePath, fileName);
            console.log(`
                {
                fileName: ${fileName},
                filePath: ${filePath}
                }
                `)
            // Create a writable stream
            const writer = fs.createWriteStream(filePath);

            // Fetch the image
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream',
            });

            // Pipe the response data to the writable stream
            response.data.pipe(writer);

            // Return a promise that resolves when the file is written
            const promise = new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(`Image saved at ${filePath}`));
                writer.on('error', reject);
            });
            const result = promise.then((message) => {
                console.log(message)
                return fileName
            })
                .catch((error) => {
                    console.log(error)
                    return ""
                })
            return result
        } catch (error) {
            console.log("an error ocured in download image fnc", error)
            throw new HttpException(error.message || "An error occurred while downloading image", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async validateOpenAIKeyWithLangChain(apiKey: string, keyName: string): Promise<boolean> {
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
                text: `This is auto generated Email, There is a problem with ${keyName} API key 
                    \n
                    the raw error is here ${error.message}
                    
                    `
            });

            return false;

        }
    }

    async queryBot(queryBot: QueryBot, req: any) {
        console.log("Data from message:", queryBot);
        let api_key = "";
        const transaction = await this.sequelize.transaction()
        try {
            // Fetch the bot by ID
            const bot = await Bot.findByPk(queryBot.bot_id, {
                include: [{
                    model: File,
                    attributes: ["id"]
                }],
                transaction
            });
            console.log("Bot in bot:", bot);

            if (!bot) {
                throw new Error("No bot with this ID exists.");
            }



            if (bot.files.length === 0) {
                throw new Error("No files are attached to this bot.");
            }

            // Fetch the API key from the admin profile
            const api = await SuperAdminProfile.findOne({
                attributes: ["openai", "master_prompt"],
            });

            if (!api) {
                throw new Error("Unable to find API key.");
            }

            api_key = api?.openai;

            if (api_key !== "") {


                // Validate API key
                const isKeyValid = await this.validateOpenAIKeyWithLangChain(api_key, "Open AI");
                if (!isKeyValid) {
                    throw new Error('The OpenAI API key is invalid or expired. Please update the key.');
                }

                // Generate embeddings for the query
                const embeddings = new OpenAIEmbeddings({
                    apiKey: api_key,
                    model: process.env.OPEN_AI_EMBEDDING_MODEL,
                    dimensions: 1536,
                });
                const embeddedQuery = await embeddings.embedQuery(queryBot.query);
                console.log("Query:", queryBot.query, "Embedded Query:", embeddedQuery);


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

                const checkpointer = PostgresSaver.fromConnString(
                    `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
                );

                await checkpointer.setup();


                /////////////////
                const retrieve = tool(
                    async ({ query }) => {
                        const retrievedDocs = await vectorStore.similaritySearch(query, 20, {
                            "file_id": {
                                "$in": bot.files.map(file => file.id)
                            }
                        });
                        const serialized = retrievedDocs
                            .map(
                                (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
                            )
                            .join("\n");
                        return [serialized, retrievedDocs];
                    },
                    {
                        name: "retrieve",
                        description: "Retrieve information related to a query.",
                        schema: retrieveSchema,
                        responseFormat: "content_and_artifact",
                    }
                );


                ////////////////

                const system_prompt = `
                
                **Response Formatting**
                **If the data includes any type of mathematical or physics or chemistry or any science related equations, formulas, equation references, equation terms, mathematical terms or mathematical expressions etc..., please provide them in LaTeX format, and wrap them in the following format:**
                 ## Mathematical, Physics, Chemistry or Any Science Related Expressions

                    **For inline LaTeX, use $ ... $, such as $ E = mc^2 $.**

                      **For block equations, use the $$ ... $$ format as shown below:**

                    $$ E = mc^2 $$
                   
                           **Bot Specific Master Prompt:**
                        ${bot?.description}\n

                        **General Prompt**
                        ${api?.master_prompt}\n
                      

                `


                // Step 1: Generate an AIMessage that may include a tool-call to be sent.
                async function queryOrRespond(state: typeof MessagesAnnotation.State) {
                    const llmWithTools = llm.bindTools([retrieve]);

                    const response = await llmWithTools.invoke(state.messages);
                    // MessagesState appends messages to state instead of overwriting
                    return { messages: [response] };
                }

                // Step 2: Execute the retrieval.
                const tools = new ToolNode([retrieve]);

                // Step 3: Generate a response using the retrieved content.
                async function generate(state: typeof MessagesAnnotation.State) {
                    // Get generated ToolMessages
                    let recentToolMessages = [];
                    for (let i = state["messages"].length - 1; i >= 0; i--) {
                        let message = state["messages"][i];
                        if (message instanceof ToolMessage) {
                            recentToolMessages.push(message);
                        } else {
                            break;
                        }
                    }
                    let toolMessages = recentToolMessages.reverse();

                    // Format into prompt
                    const docsContent = toolMessages.map((doc) => doc.content).join("\n");

                    const systemMessageContent =
                        system_prompt +
                        "\n\n **Context**" +
                        `${docsContent}`;

                    const conversationMessages = state.messages.filter(
                        (message) =>
                            message instanceof HumanMessage ||
                            message instanceof SystemMessage ||
                            (message instanceof AIMessage && message.tool_calls.length == 0)
                    );

                    // Create a new AIMessage instance with zero tool calls
                    const newAIMessage = new AIMessage(`${bot.first_message}`);

                    // Add the new AIMessage to the top of the conversationMessages array
                    conversationMessages.unshift(newAIMessage);
                    console.log("conversation message", conversationMessages)
                    const prompt = [
                        new SystemMessage(systemMessageContent),
                        ...conversationMessages,
                    ];

                    // Run
                    const response = await llm.invoke(prompt);

                    return { messages: [response] };
                }

                const graphBuilder = new StateGraph(MessagesAnnotation)
                    .addNode("queryOrRespond", queryOrRespond)
                    .addNode("tools", tools)
                    .addNode("generate", generate)
                    .addEdge("__start__", "queryOrRespond")
                    .addConditionalEdges("queryOrRespond", toolsCondition, {
                        __end__: "__end__",
                        tools: "tools",
                    })
                    .addEdge("tools", "generate")
                    .addEdge("generate", "__end__");

                const graph = graphBuilder.compile({ checkpointer: checkpointer });



                // Initialize the OpenAI model
                const llm = new ChatOpenAI({
                    model: bot?.ai_model,
                    temperature: 0,
                    maxTokens: 1000,
                    timeout: 15000,
                    maxRetries: 2,
                    apiKey: api_key,
                });

                // const llm_structured = llm.bindTools([outputSchema])


                let thredConfig = { configurable: { thread_id: `${queryBot.bot_id}-${req.user.sub}` } };

                const extractAnswer = (res) => {

                    for (const step of res.messages.reverse()) {


                        const answer = extractAnswerContent(step);
                        if (answer == "") {
                            continue
                        } else if (answer != "") {
                            return answer
                        }

                    }
                }
                const extractAnswerContent = (message: BaseMessage) => {

                    let txt;
                    if (isAIMessage(message) && message.tool_calls.length == 0) {

                        txt = message.content
                        return txt
                    }
                    return ""
                };



                let input = {
                    messages: [{ role: "user", content: queryBot.query }],
                };

                const response = await graph.invoke(input, thredConfig)

                const answer = extractAnswer(response)

                console.log("answer", answer)

                const template = `
               **Do not include any part of the prompt or any internal analysis in the response**

- You are a model designed to perform two tasks:
  1. Apply markdown formatting (and LaTeX formatting for scientific expressions) to the provided answer.
  2. Analyze the given query and answer to decide if an image should be generated, setting the value of \`shouldGenerateImage\` to true or false.

- Do not change any of the original text content of the answer: {answer}. Your job is solely to format it according to the instructions below.

- If the data includes any mathematical, physics, chemistry, or any science-related equations, formulas, references, or expressions, please provide them in LaTeX format using the following guidelines:

  ## Mathematical, Physics, Chemistry or Any Science Related Expressions

  **For inline LaTeX, use $ ... $, such as $ E = mc^2 $.**

  **For block equations, use the $$ ... $$ format as shown below:**

  $$
  E = mc^2
  $$

- The markdown formatting requirements are:
   1. Headings using # for H1, ## for H2, ### for H3, and so on.
                2. Bold text using ** around the text.
                3. Italicized text using * around the text.
                4. Blockquotes using > at the beginning of the line.
                5. Ordered lists using numbers followed by a period (e.g., 1. First item).
                6. Unordered lists using - (or * or +) at the beginning of the line.
                7. Inline code using backticks (\`\` \`code\` \`\`).
                8. Code blocks using triple backticks (\`\`\`\` \`\`\` \`\`\`\`) with an optional language identifier for syntax highlighting.
                9. Horizontal rule using ---.
                10. Links using [title](URL).
                          

- The final output must be a JSON object with exactly the following structure, without any extra commentary:

**Expected JSON output**

{{
  "answer": "markdown-formatted string",
  "shouldGenerateImage": "boolean"
}}

- Ensure that the output does not include any internal chain-of-thought details or analysis. Only the formatted answer and the boolean flag are to be returned.
            
                
                `

                const imageGenrateTemplate = ChatPromptTemplate.fromMessages([
                    ["system", template],
                ]);

                const promptValue = await imageGenrateTemplate.invoke({
                    query: queryBot.query,
                    answer: answer
                });

                const llm_structured = llm.withStructuredOutput(outputSchema)

                const formattedResponse = await llm_structured.invoke(promptValue)

                // const jsonResponse = JSON.parse(stringJSON)
                console.log("formatted json response", formattedResponse)



                if (formattedResponse?.answer !== "" && formattedResponse.shouldGenerateImage != undefined) {
                    // Save the bot's response to the chat
                    const botRes = await Chat.create({
                        bot_id: queryBot.bot_id,
                        message: formattedResponse?.answer,
                        is_bot: true,
                        image_url: "",
                        user_id: req.user.sub,
                    }, {
                        transaction
                    });

                    await transaction.commit()

                    return {
                        statusCode: 200,
                        data: botRes,
                        do_generate_image: formattedResponse?.shouldGenerateImage
                    };
                } else {
                    throw new Error("An error occurred while generating the response.");
                }
            } else {
                await transaction.rollback()
                throw new Error("No API key found.");
            }
        } catch (error: any) {
            console.log("Error:", error);
            throw new HttpException(error.message || "Error querying bot", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async deleteChatHistory(id: string) {

        const pool = new Pool({

            host: `${process.env.DB_HOST}`,

            password: `${process.env.DB_PASSWORD}`,
            database: `${process.env.DB_NAME}`,

            port: Number(`${process.env.DB_PORT}`),
            user: `${process.env.DB_USERNAME}`,


        });
        const client = await pool.connect();
        try {
            const tables = [
                'checkpoints',
                'checkpoint_writes',
                // 'checkpoint_migrations',
                'checkpoint_blobs',
            ];

            const params = [`${id}-%`];

            for (const table of tables) {
                // Check if the table exists in the database
                const tableExistsQuery = `
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    ) AS table_exists;
                `;
                const result = await client.query(tableExistsQuery, [table]);

                if (result.rows[0].table_exists) {
                    // If the table exists, delete records
                    const deleteQuery = `DELETE FROM ${table} WHERE thread_id LIKE $1`;
                    await client.query(deleteQuery, params);
                }
            }
        } catch (error) {
            console.log("chat history deletion error", error);
            client.release();
            throw new HttpException(error.message || 'Failed Deleting Chat History', HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }


    async updateBot(updateBotDto: UpdateBotDto, req: any) {
        const transaction = await this.sequelize.transaction()
        try {
            const bot = await Bot.findOne({
                where: {
                    id: {
                        [Op.eq]: updateBotDto.id
                    }
                }
            })

            if (!bot) {
                throw new Error("Bot with this id does not exist")

            }

            bot.name = updateBotDto.name
            bot.description = updateBotDto.description
            bot.ai_model = updateBotDto.ai_model
            bot.level_id = updateBotDto.level_id
            bot.subject_id = updateBotDto.subject_id
            bot.display_name = updateBotDto.display_name
            bot.first_message = updateBotDto.first_message
            bot.voice_model = updateBotDto.voice_model

            await bot.save()

            return {
                statusCode: 200,
                message: "bot updated successfully"
            }
        } catch (error) {
            throw new HttpException(error.message || "Error updating bot in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async createBot(image: Express.Multer.File, createBotDto: CreateBotDto, req: any) {
        console.log(createBotDto);
        const transaction = await this.sequelize.transaction();

        try {
            const bot_already_exist = await Bot.findOne({
                where: {
                    [Op.and]: {
                        level_id: {
                            [Op.eq]: Number(createBotDto.level_id)
                        },
                        subject_id: {
                            [Op.eq]: Number(createBotDto.subject_id)
                        },
                        deletedAt: {
                            [Op.eq]: null
                        }
                    }
                },
                transaction
            });

            if (bot_already_exist) {
                throw new Error("Bot with level and subject already exist");
            }

            const bot = await Bot.create({
                name: createBotDto.name,
                description: createBotDto.description,
                ai_model: createBotDto.ai_model,
                level_id: Number(createBotDto.level_id),
                user_id: req.user.sub,
                bot_image_url: `${image.filename}`,
                voice_model: createBotDto.voice_model,
                subject_id: Number(createBotDto.subject_id),
                display_name: createBotDto.display_name,
                first_message: createBotDto.first_message
            }, { transaction });

            await Join_BotContextData.create({
                bot_id: bot.id,
                file_id: Number(createBotDto.file_id)
            }, { transaction });

            await transaction.commit();

            return {
                statusCode: 200,
                message: "Bot Created successfully"
            };
        } catch (error) {
            await transaction.rollback();
            console.log(error);
            throw new HttpException(error.message || "Failed to create bot", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async deleteBot(deleteBotDto: DeleteBotDto) {
        try {

            await Join_BotContextData.destroy({
                where: {
                    bot_id: {
                        [Op.eq]: deleteBotDto.bot_id
                    },
                }
            }).then(async () => {
                await this.deleteChatHistory(`${deleteBotDto.bot_id}`)
                await Bot.destroy({
                    where: {
                        id: deleteBotDto.bot_id
                    }
                })
            })

            return {
                statusCode: 200,
                message: "bot DELETED successfully"
            }
        } catch (error) {
            console.log(error)
            throw new HttpException(error.message || "Error deleting bot in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async getBotContextDto(getBotContextDto: GetBotContextDto) {
        try {
            const data = await Join_BotContextData.findAll({
                where: {
                    bot_id: {
                        [Op.eq]: getBotContextDto.bot_id
                    },
                }
            })
            return {
                statusCode: 200,
                data: data,

            }
        } catch (error) {
            throw new HttpException(error.message || "Error getting bot_contextData in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async deleteJoinBot_ContextData(deleteBotContextDto: DeleteBotContextDto,) {
        try {
            await Join_BotContextData.destroy({
                where: {
                    bot_id: {
                        [Op.eq]: deleteBotContextDto.bot_id
                    },
                    file_id: {
                        [Op.eq]: deleteBotContextDto.file_id
                    },
                }

            })
            return {
                statusCode: 200,
                message: "bot_contextData created successfully"
            }


        } catch (error) {
            throw new HttpException(error.message || "Error deleting bot_contextData in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createJoinBot_ContextData(createBotContextDto: CreateBotContextDto) {
        try {
            await Join_BotContextData.create({
                bot_id: createBotContextDto.bot_id,
                file_id: createBotContextDto.file_id
            })
            return {
                statusCode: 200,
                message: "bot_contextData created successfully"
            }


        } catch (error) {
            throw new HttpException(error.message || "Error creating bot_contextData in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async updateJoinBot_ContextData(updateJoinBot_Context: UpdateBotContextDto) {
        try {

            await Join_BotContextData.update({
                bot_id: updateJoinBot_Context.bot_id,
                file_id: updateJoinBot_Context.file_id
            }, {
                where: {
                    bot_id: {
                        [Op.eq]: updateJoinBot_Context.bot_id
                    },

                }
            })
            return {
                statusCode: 200,
                message: "bot_contextData updated successfully"
            }
        } catch (error) {
            throw new HttpException(error.message || "Error updating bot_contextData in DB", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async getBotsByLevel(req: any) {
        console.log("user in bot by level", req.user)
        try {
            // Fetch all bots with level
            const bots = await Bot.findAll({
                where: {
                    level_id: {
                        [Op.eq]: req?.user.level_id
                    }
                }
            });

            return {
                statusCode: 200,
                message: "Bots fetched successfully",
                bots: bots, // Include the fetched bots in the response
            };
        } catch (error) {
            this.logger.error("Error fetching bots: ", error.message);
            throw new HttpException(error.message || "Error fetching bots from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllBotsByTeacher(req: any, page: number = 1, limit: number = 10) {
        try {
            // Calculate the offset based on the page and limit
            const offset = (page - 1) * limit;

            // Fetch the teacher's profile
            const data = await TeacherProfile.findOne({
                attributes: ["id"],
                include: [{
                    model: Subject,
                    attributes: ["id"],
                    include: [{
                        model: Bot,
                        attributes: {
                            exclude: ["description"]
                        }
                    }]
                }],
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub,
                    },
                },
            });

            let botsData = []

            data.subjects.forEach(subject => {
                botsData.push(subject.bot)
            })
            // if (!teacher_profile) {
            //     throw new Error("Teacher profile not found");
            // }

            // // Fetch the teacher's subject and level data
            // const teacher_data = await JoinTeacherSubjectLevel.findAll({
            //     where: {
            //         teacher_id: {
            //             [Op.eq]: teacher_profile.id,
            //         },
            //     },
            // });

            // if (teacher_data.length === 0) {
            //     throw new Error("No subjects or levels assigned to the teacher");
            // }

            // Fetch paginated bots based on the teacher's subjects and levels
            // const { rows: bots, count: total } = await Bot.findAndCountAll({
            //     include: [{
            //         model: Subject,
            //         attributes: [],
            //         include: [{
            //             model: TeacherProfile,
            //             attributes: [],
            //             where: {
            //                 user_id: {
            //                     [Op.eq]: req.user.sub
            //                 }
            //             }
            //         }]
            //     }],

            //     limit, // Number of records to fetch
            //     offset, // Starting point for the records
            //     order: [['createdAt', 'DESC']], // Optional: Sort by creation date
            // });

            // // Calculate the total number of pages
            // const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Bots fetched successfully",
                bots: botsData, // Paginated bots

            };
        } catch (error) {
            this.logger.error("Error fetching bots: ", error.message);
            throw new HttpException(error.message || "Error fetching bots from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllBots(req: any, page: number = 1, limit: number = 10) {
        try {
            // Calculate the offset based on the page and limit
            const offset = (page - 1) * limit;

            // Fetch paginated data from the database
            const { rows: bots, count: total } = await Bot.findAndCountAll({
                limit, // Number of records to fetch
                offset, // Starting point for the records
                order: [['createdAt', 'DESC']], // Optional: Sort by creation date
            });

            // Calculate the total number of pages
            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Bots fetched successfully",
                bots, // Paginated bots
                total, // Total number of bots
                page, // Current page
                totalPages, // Total number of pages
            };
        } catch (error) {
            this.logger.error("Error fetching bots: ", error.message);
            throw new HttpException(error.message || "Error fetching bots from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async getAllBotsBySchool(req: any, page: number = 1, limit: number = 10) {
        try {
            // Calculate the offset based on the page and limit
            const offset = (page - 1) * limit;

            // Fetch paginated data from the database
            const { rows: bots, count: total } = await Bot.findAndCountAll({

                limit, // Number of records to fetch
                offset, // Starting point for the records
                order: [['createdAt', 'DESC']], // Optional: Sort by creation date
            });

            // Calculate the total number of pages
            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Bots fetched successfully",
                bots, // Paginated bots
                total, // Total number of bots
                page, // Current page
                totalPages, // Total number of pages
            };
        } catch (error) {
            this.logger.error("Error fetching bots: ", error.message);
            throw new HttpException(error.message || "Error fetching bots from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async getBotBySubject(getBotDto: GetBotBySubjectDto, req: any) {
        try {

            const data = await TeacherProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            }).then(async (teacher) => {
                const bot = await Bot.findOne({
                    where: {
                        subject_id: {
                            [Op.eq]: getBotDto?.subject_id
                        },
                        level_id: {
                            [Op.eq]: teacher.level_id
                        },

                    },
                    attributes: {
                        exclude: ["description", "ai_model", "voice_model", "level_id", "subject_id", "user_id", "createdAt", "updatedAt", "deletedAt"]
                    }
                })
                return bot
            })


            return {
                statusCode: 200,
                bot: data
            }
        } catch (error) {
            throw new HttpException(error.message || "Unable to get bot", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBot(getBotDto: GetBotDto) {
        try {
            const bot = await Bot.findByPk(getBotDto?.bot_id)

            return {
                statusCode: 200,
                bot: bot
            }
        } catch (error) {
            throw new HttpException(error.message || "Unable to get bot", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getBotByLevelSubject(getBotByLevelSubject: GetBotByLevelSubject, req: any) {
        try {
            const bot = await Bot.findOne({
                where: {
                    subject_id: {
                        [Op.eq]: getBotByLevelSubject.subject_id
                    },
                    level_id: {
                        [Op.eq]: getBotByLevelSubject.level_id
                    },

                }
            })

            return {
                statusCode: 200,
                bot: bot
            }
        } catch (error) {
            throw new HttpException(error.message || "Unable to get bot by level subject ids", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
