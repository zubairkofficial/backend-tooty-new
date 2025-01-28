import { Op } from 'sequelize';
import { CreateChatDto } from './dto/create-chat.dto';
import { Chat } from './entities/chat.entity';
import { BotService } from 'src/bot/bot.service';
import { FetchChatDto, FetchChatHistoryDto } from './dto/fetch-chat.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

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

            const data = await Chat.findAll({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    },
                    bot_id: {
                        [Op.eq]: fetchChatDto.bot_id
                    }
                }
            })

            return {
                statusCode: 200,
                data: data
            }
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
