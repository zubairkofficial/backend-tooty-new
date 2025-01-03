// src/controllers/Quiz.controller.ts
import { Controller, Get, Post, Body, Param, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { QuizService } from './quiz.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @Post()
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createQuizDto: CreateQuizDto, @Req() req: any): Promise<Quiz> {
    return await this.quizService.create(createQuizDto, req);
  }

  @Get()
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(): Promise<Quiz[]> {
    return this.quizService.findAll();
  }

  @Get(':id')
  @Roles(Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: number): Promise<Quiz> {
    return await this.quizService.findOne(id);
  }
}