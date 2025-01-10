import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Option } from 'src/option/entities/option.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Quiz, Option]), ConfigModule],
  controllers: [QuestionController],
  providers: [QuestionService, JwtService],
})
export class QuestionModule { }
