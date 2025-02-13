import { Op } from 'sequelize';
import { CreateChatDto } from './dto/create-chat.dto';
import { Chat } from './entities/chat.entity';
import { BotService } from 'src/bot/bot.service';
import { FetchChatDto, FetchChatHistoryDto } from './dto/fetch-chat.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Bot } from 'src/bot/entities/bot.entity';

export class ChatService {
    constructor(
        private botService: BotService
    ) { }


    async fetchChatHistory(fetchChatHistoryDto: FetchChatHistoryDto, req: any) {
        try {

            const data = await Chat.findAll({
                where: {
                    user_id: {
                        [Op.eq]: fetchChatHistoryDto.user_id
                    },
                    bot_id: {
                        [Op.eq]: fetchChatHistoryDto.bot_id
                    }
                }
            })

            return {
                statusCode: 200,
                data: data
            }
        } catch (error) {
            throw new HttpException(error.message || 'Error fetching chats history', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fetchChat(fetchChatDto: FetchChatDto, req: any) {
        try {
            let chats;
            const bot = await Bot.findByPk(fetchChatDto.bot_id, {
                attributes: ["first_message"]
            })

            const first_message = {
                id: 0,
                bot_id: fetchChatDto.bot_id,
                user_id: req.user.sub,
                message: bot?.first_message || "Hello! How can I assist you?",
                image_url: "",
                is_bot: true
            }
            const newMessage = new Chat(first_message)


            // Get pagination parameters from the request DTO (default values applied)
            const { bot_id, page = 1, limit = 20 } = fetchChatDto;
            const offset = (page - 1) * limit; // Calculate offset

            const data = await Chat.findAll({
                where: {
                    user_id: req.user.sub,
                    bot_id: bot_id
                },
                raw: true,
                order: [['createdAt', 'DESC']], // Order by latest messages
                limit: limit, // Number of messages per request
                offset: offset, // Pagination offset
            });

            if (data.length < limit && data.length > 0) {
                chats = [newMessage, ...data.reverse()]
            } else {
                chats = data.reverse()
            }

            return {
                statusCode: 200,
                data: chats,
                pagination: {
                    currentPage: page,
                    perPage: limit,
                    hasMore: data.length === limit, // If full limit is fetched, there might be more
                }
            };
        } catch (error) {
            throw new HttpException(error.message || 'Error fetching chats', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async sendMessage(createChatDto: CreateChatDto, req: any) {
        console.log("creating message body", createChatDto)
        try {
            const chat = await Chat.create({
                bot_id: createChatDto.bot_id,
                message: createChatDto.message,
                is_bot: false,
                user_id: req.user.sub,
                image_url: ""
            });
            console.log("create user message", chat)

            return {
                statusCode: 200,
                message: "message by user created successfully"
            }

        } catch (error) {
            console.log(error)
            throw new HttpException(error.message || 'Error creating message', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}
