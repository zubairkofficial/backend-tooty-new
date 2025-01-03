import { Controller, Post, Body, UseGuards, Req, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { FetchChatDto, FetchChatHistoryDto } from './dto/fetch-chat.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('Chat') // Grouping API under the "Chat" tag in Swagger UI
@Controller('chat')
export class ChatController {
    constructor(private readonly chatSerivce: ChatService) {}

    @Post('/fetch-chat-history')
    @ApiOperation({ summary: 'Fetch chat history for a given bot and user' })
    @ApiResponse({
        status: 200,
        description: 'Successfully fetched chat history',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request due to invalid input',
    })
    @ApiResponse({
        status: 404,
        description: 'No chat history found for the provided bot and user',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    fetchChatHistory(@Body() fetchChatHistoryDto: FetchChatHistoryDto, @Req() req: any) {
        return this.chatSerivce.fetchChatHistory(fetchChatHistoryDto, req);
    }

    @Post('/fetch-chat')
    @ApiOperation({ summary: 'Fetch chat between bot and user' })
    @ApiResponse({
        status: 200,
        description: 'Successfully fetched the chat messages',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request due to invalid input',
    })
    @ApiResponse({
        status: 404,
        description: 'No chat found for the given bot and user',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    @Roles(Role.USER, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    fetchChat(@Body() fetchChatDto: FetchChatDto, @Req() req: any) {
        return this.chatSerivce.fetchChat(fetchChatDto, req);
    }

    @Post('/create-message')
    @ApiOperation({ summary: 'Send a message or reply to a session' })
    @ApiResponse({
        status: 200,
        description: 'Message sent successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request due to invalid input',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    @ApiBody({
        description: 'The message and chat session details',
        type: CreateChatDto,
    })
    @Roles(Role.USER, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    sendMessage(@Body() createChatDto: CreateChatDto, @Req() req: any) {
        return this.chatSerivce.sendMessage(createChatDto, req);
    }
}
