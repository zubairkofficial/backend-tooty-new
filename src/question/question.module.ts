import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService, JwtService],
})
export class QuestionModule {}
