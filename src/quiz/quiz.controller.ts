// src/controllers/Quiz.controller.ts
import { Controller, Get, Post, Body, Param, NotFoundException, UseGuards, Req, Put, Delete, Patch } from '@nestjs/common';
import { CreateQuizDto, EditQuizDto } from './dto/create-quiz.dto';
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


  @Delete(':quizId')
  @Roles(Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteQuiz(@Param('quizId') quizId: number) {
    return this.quizService.deleteQuiz(Number(quizId));
  }


  @Patch('')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async editQuiz(

    @Body() editQuizDto: EditQuizDto,
    @Req() req: any,
  ): Promise<Quiz> {
    return this.quizService.editQuiz(editQuizDto, req);
  }



  @Get()
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Req() req: any): Promise<Quiz[]> {
    return this.quizService.findAll(req);
  }


  @Get('/get-quiz-by-level')
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAllQuizByLevel(@Req() req: any): Promise<Quiz[]> {
    return this.quizService.findAllQuizByLevel(req);
  }
  @Get(':id')
  @Roles(Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: number, @Req() req: any) {
    return this.quizService.findOne(id, req);
  }
}