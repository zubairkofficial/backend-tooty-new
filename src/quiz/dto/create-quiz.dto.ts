// src/dto/CreateQuiz.dto.ts
import { IsNotEmpty, IsEnum, IsDateString, IsInt, IsNumber, IsString } from 'class-validator';
import { QuestionDto } from 'src/question/dto/create-question.dto';
import { QuizType } from 'src/utils/quizType.enum';

export class CreateQuizDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsEnum(QuizType)
  quiz_type: string;

  @IsDateString()
  start_time: Date;

  @IsDateString()
  end_time: Date;

  @IsInt()
  duration: number; // Duration in minutes



  @IsNumber()
  subject_id: number;

  
  @IsNotEmpty()
  questions: QuestionDto[];
}