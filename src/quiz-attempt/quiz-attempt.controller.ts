// src/quiz-attempt/quiz-attempt.controller.ts
import { Controller, Post, Body, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { CreateSubmitQuizAttemptDto, SubmitQuizAttemptDto } from './dto/quiz-attempt.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';

@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) { }

  @Get('get-quiz-attempt-detail/:attempt_id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getQuizAttemptDetailById(@Param() params: any, @Req() req: any) {

    return this.quizAttemptService.getQuizAttemptDetailById(params, req);
  }

  @Get('/:subject_id/:student_id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getQuizAttemptsByStudentSubject(@Param() params: any, @Req() req: any, @Query('page') page?: number,
    @Query('limit') limit?: number) {
    return this.quizAttemptService.getQuizAttemptsByStudentSubject(params, req, page, limit);
  }

  @Get('student-quiz-history')
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getQuizAttemptsByStudent(@Req() req: any) {
    return this.quizAttemptService.getQuizAttemptsByStudent(req);
  }

  @Post('create-submition')
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseGuards(JwtAuthGuard)
  async createSubmitQuizAttempt(@Body() createSubmitQuizAttemptDto: CreateSubmitQuizAttemptDto, @Req() req: any) {
    const userId = req.user.sub; // Get the user ID from the request
    return this.quizAttemptService.createSubmitQuizAttempt(userId, createSubmitQuizAttemptDto);
  }

  @Post('submit')
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseGuards(JwtAuthGuard)
  async submitQuizAttempt(@Body() submitQuizAttemptDto: SubmitQuizAttemptDto, @Req() req: any) {
    const userId = req.user.sub; // Get the user ID from the request
    return this.quizAttemptService.submitQuizAttempt(userId, submitQuizAttemptDto);
  }
}