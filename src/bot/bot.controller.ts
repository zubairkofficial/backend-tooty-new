import { Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { BotService } from './bot.service';
import { CreateBotDto, DeleteBotDto, GetBotByLevelSubject, GetBotBySubjectDto, GetBotDto, QueryBot, UpdateBotDto } from './dto/create-bot.dto';
import { CreateBotContextDto, DeleteBotContextDto, GetBotContextDto, UpdateBotContextDto } from './dto/create-Join-bot-data.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { GenerateImageDto } from './dto/generateImage.dto';
import { GetBotByLevelDto } from './dto/get-bot-by-level.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerStorageConfig } from 'src/config/multer.config';
import { ApiOperation, ApiResponse, ApiBody, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Bot')
@ApiBearerAuth('access-token')
@Controller('bot')
export class BotController {
    constructor(private readonly botService: BotService) { }

    @Post('generate-image')
    @Roles(Role.USER, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Generate image for bot' })
    @ApiResponse({ status: 200, description: 'Image generated successfully' })
    async generateImage(@Body() generateImageDto: GenerateImageDto, @Req() req: any) {
        return this.botService.generateImage(generateImageDto, req)
    }

    @Post('query-bot')
    @Roles(Role.USER, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Query bot based on specific parameters' })
    @ApiResponse({ status: 200, description: 'Bot queried successfully' })
    async queryBot(@Body() queryBot: QueryBot, @Req() req: any) {
        return this.botService.queryBot(queryBot, req)
    }

    @Post('create-bot')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('image', multerStorageConfig))
    @ApiOperation({ summary: 'Create a new bot' })
    @ApiResponse({ status: 201, description: 'Bot created successfully' })
    @ApiResponse({ status: 400, description: 'No image uploaded' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary', description: 'Bot image' },
                ...CreateBotDto
            }
        }
    })
    async createBot(@UploadedFile() image: Express.Multer.File, @Body() createBotDto: CreateBotDto, @Req() req: any, @Res() res: Response): Promise<any> {
        if (!image) {
            return { message: 'No image uploaded' };
        }

        return this.botService.createBot(image, createBotDto, req, res)

    }

    @Put('update-bot')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update bot details' })
    @ApiResponse({ status: 200, description: 'Bot updated successfully' })
    async updateBot(@Body() updateBotDto: UpdateBotDto, @Req() req: any) {
        return this.botService.updateBot(updateBotDto, req)
    }

    @Delete('delete-bot')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete a bot' })
    @ApiResponse({ status: 200, description: 'Bot deleted successfully' })
    async deleteBot(@Body() deleteBotDto: DeleteBotDto, @Req() req: any) {
        return this.botService.deleteBot(deleteBotDto)
    }

    @Post('create-join-bot-context')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a context for joining bot' })
    @ApiResponse({ status: 201, description: 'Bot context created successfully' })
    async createJoinBotContext(@Body() createBotContextDto: CreateBotContextDto, @Req() req: any) {
        return this.botService.createJoinBot_ContextData(createBotContextDto)
    }

    @Delete('delete-join-bot-context')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete context for bot' })
    @ApiResponse({ status: 200, description: 'Bot context deleted successfully' })
    async deleteJoinBotContext(@Body() deleteBotContextDto: DeleteBotContextDto, @Req() req: any) {
        return this.botService.deleteJoinBot_ContextData(deleteBotContextDto)
    }

    @Put('update-join-bot-context')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update bot join context' })
    @ApiResponse({ status: 200, description: 'Bot join context updated successfully' })
    async updateJoinBotContext(@Body() updateJoinBot_Context: UpdateBotContextDto, @Req() req: any) {
        return this.botService.updateJoinBot_ContextData(updateJoinBot_Context)
    }

    @Post('get-join-bot-context')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get bot join context' })
    @ApiResponse({ status: 200, description: 'Bot join context retrieved' })
    async getJoinBotContext(@Body() getBotContextDto: GetBotContextDto, @Req() req: any) {
        return this.botService.getBotContextDto(getBotContextDto)
    }

    @Post('get-bot')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get bot details' })
    @ApiResponse({ status: 200, description: 'Bot retrieved successfully' })
    async getBot(@Body() getBotDto: GetBotDto, @Req() req: any) {
        return this.botService.getBot(getBotDto)
    }

    @Post('get-bot-by-subject')
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get bot by subject' })
    @ApiResponse({ status: 200, description: 'Bot by subject retrieved' })
    async getBotBySubject(@Body() getBotDto: GetBotBySubjectDto, @Req() req: any) {
        return this.botService.getBotBySubject(getBotDto, req)
    }

    @Post('get-bot-by-level-subject')
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get bot by level and subject' })
    @ApiResponse({ status: 200, description: 'Bot by level and subject retrieved' })
    async getBotByLevelSubject(@Body() getBotByLevelSubject: GetBotByLevelSubject, @Req() req: any) {
        return this.botService.getBotByLevelSubject(getBotByLevelSubject)
    }


    @Get('get-all-bots-by-teacher')
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all bots by teacher' })
    @ApiResponse({ status: 200, description: 'All bots by teacher retrieved' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllBotsByTeacher(
        @Req() req: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.botService.getAllBotsByTeacher(req, page, limit);
    }

    @Get('get-all-bots')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all bots by admin' })
    @ApiResponse({ status: 200, description: 'All bots by admin retrieved' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllBotsByAdmin(
        @Req() req: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.botService.getAllBotsByAdmin(req, page, limit);
    }

    @Get('get-bots-by-level')
    @Roles(Role.USER, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get bots by level' })
    @ApiResponse({ status: 200, description: 'Bots by level retrieved' })
    async getBotsByLevel(@Req() req: any) {
        return this.botService.getBotsByLevel(req)
    }
}
