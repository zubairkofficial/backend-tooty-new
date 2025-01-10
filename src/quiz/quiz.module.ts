import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { Quiz } from './entities/quiz.entity';
import { Level } from '../level/entity/level.entity';
import { Subject } from '../subject/entity/subject.entity';
import { Question } from '../question/entities/question.entity';
import { Option } from '../option/entities/option.entity';
import { JwtService } from '@nestjs/jwt';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([Quiz, Level, Subject, Question, Option, QuizAttempt, TeacherProfile]),ConfigModule
  ],
  controllers: [QuizController],
  providers: [QuizService, JwtService],
})
export class QuizModule { }