import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Level } from './entity/level.entity';
import { ConfigModule } from '@nestjs/config';
import { School } from 'src/school/entities/school.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { File } from 'src/context_data/entities/file.entity';

@Module({
  imports: [SequelizeModule.forFeature([Level, School, StudentProfile, TeacherProfile,  Bot, JoinTeacherSubjectLevel, Subject, File]), ConfigModule],
  controllers: [LevelController],
  providers: [LevelService, JwtService]
})
export class LevelModule { }
