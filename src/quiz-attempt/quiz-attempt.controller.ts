// src/quiz-attempt/quiz-attempt.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { SubmitQuizAttemptDto } from './dto/quiz-attempt.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';

@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  @Post('submit')
  @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
  @UseGuards(JwtAuthGuard)
  async submitQuizAttempt(@Body() submitQuizAttemptDto: SubmitQuizAttemptDto, @Req() req: any) {
    const userId = req.user.sub; // Get the user ID from the request
    return this.quizAttemptService.submitQuizAttempt(userId, submitQuizAttemptDto);
  }
}