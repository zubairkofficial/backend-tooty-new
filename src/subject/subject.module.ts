import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subject } from './entity/subject.entity';
import { ConfigModule } from '@nestjs/config';
import { Level } from 'src/level/entity/level.entity';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { School } from 'src/school/entities/school.entity';
import { File } from 'src/context_data/entities/file.entity';
import { User } from 'src/user/entities/user.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';

@Module({
  imports: [SequelizeModule.forFeature([Subject, Level, JoinTeacherSubjectLevel, TeacherProfile, Bot, School, File, User, Quiz]), ConfigModule],
  controllers: [SubjectController],
  providers: [SubjectService, JwtService]
})
export class SubjectModule {}
