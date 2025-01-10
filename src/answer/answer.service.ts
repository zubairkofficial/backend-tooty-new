import { Injectable } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class AnswerService {
  create(createAnswerDto: CreateAnswerDto) {
    return 'This action adds a new answer';
  }

  findAll() {
    return `This action returns all answer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} answer`;
  }

 

  remove(id: number) {
    return `This action removes a #${id} answer`;
  }
}
