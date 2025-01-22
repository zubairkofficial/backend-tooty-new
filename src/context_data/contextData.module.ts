import { Module } from '@nestjs/common';
import { ContextDataController } from './contextData.controller';
import { ContextDataService } from './contextData.service';
import { SequelizeModule } from '@nestjs/sequelize';

import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { File } from './entities/file.entity';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { School } from 'src/school/entities/school.entity';
import { Level } from 'src/level/entity/level.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([File, SuperAdminProfile,Bot, Subject, School, Level]), ConfigModule],
  controllers: [ContextDataController],
  providers: [ContextDataService, JwtService]
})
export class ContextDataModule { }
