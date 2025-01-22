// src/dto/Question.dto.ts
import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { EditOptionDto, OptionDto } from 'src/option/dto/create-option.dto';
import { QuizType } from 'src/utils/quizType.enum';



export class EditQuestionDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsOptional()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  @IsNumber()
  score?: number;


  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EditOptionDto)
  options?: EditOptionDto[];
}

export class QuestionDto {
  @IsNotEmpty()
  text: string;

  @IsEnum([QuizType.MCQS, QuizType.QA])
  questionType: string;


  @IsNumber()
  score: number;

  @Optional()
  @IsNotEmpty()
  options: OptionDto[];
}