import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { UpdateQuizAttemptDto } from './dto/update-quiz-attempt.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) { }

  @Post()
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() createQuizAttemptDto: CreateQuizAttemptDto) {
    return this.quizAttemptService.create(createQuizAttemptDto);
  }


  @Get()
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.quizAttemptService.findAll();
  }

  @Get(':id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.quizAttemptService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateQuizAttemptDto: UpdateQuizAttemptDto) {
    return this.quizAttemptService.update(+id, updateQuizAttemptDto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.quizAttemptService.remove(+id);
  }
}
