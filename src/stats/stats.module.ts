import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../user/entities/user.entity';
import { School } from '../school/entities/school.entity';
import { TeacherProfile } from '../profile/entities/teacher-profile.entity';
import { StudentProfile } from '../profile/entities/student-profile.entity';
import { Bot } from '../bot/entities/bot.entity';
import { Level } from '../level/entity/level.entity';
import { Subject } from '../subject/entity/subject.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { JwtService } from '@nestjs/jwt';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      School,
      TeacherProfile,
      StudentProfile,
      Bot,
      Level,
      Subject,
      Quiz,
      QuizAttempt
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService,JwtService],
})
export class StatsModule {}