import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bot } from './entities/bot.entity';
import { ConfigModule } from '@nestjs/config';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/chat/chat.service';
import { ApiService } from 'src/api/api.service';
import { School } from 'src/school/entities/school.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
    imports: [SequelizeModule.forFeature([Bot, School, Subject, Bot, TeacherProfile, User]), ConfigModule],
    controllers: [BotController],
    providers: [BotService, JwtService, ChatService, ApiService],
})
export class BotModule { }
