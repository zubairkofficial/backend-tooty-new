import { Module } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AnswerController],
  providers: [AnswerService, JwtService],
})
export class AnswerModule {}
