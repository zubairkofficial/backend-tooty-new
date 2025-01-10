// src/dto/CreateQuiz.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsEnum, IsDateString, IsInt, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { EditQuestionDto, QuestionDto } from 'src/question/dto/create-question.dto';
import { QuizType } from 'src/utils/quizType.enum';


export class EditQuizDto {
  @IsNumber()
  id: number
  
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsDateString()
  start_time?: Date;

  @IsOptional()
  @IsDateString()
  end_time?: Date;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  subject_id?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EditQuestionDto)
  questions?: EditQuestionDto[];
}


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