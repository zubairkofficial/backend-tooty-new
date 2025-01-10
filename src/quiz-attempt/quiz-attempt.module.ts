import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttempt } from './entities/quiz-attempt.entity'; // Import your QuizAttempt entity
import { Quiz } from '../quiz/entities/quiz.entity'; // Import other related entities if needed
import { User } from '../user/entities/user.entity'; // Example: Import User entity if needed
import { JwtService } from '@nestjs/jwt';
import { Answer } from 'src/answer/entities/answer.entity';
import { Question } from 'src/question/entities/question.entity';
import { Option } from 'src/option/entities/option.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([QuizAttempt, Quiz, User,Answer,Question,Option, StudentProfile]), // Register models with Sequelize
  ],
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService, JwtService],
})
export class QuizAttemptModule {}