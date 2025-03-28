// src/quiz-attempt/dto/quiz-attempt.dto.ts
import { IsInt, IsArray, ValidateNested, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsInt()
  @IsOptional()
  question_id: number;

  @IsOptional()
  @IsInt()
  option_id?: number; // For multiple-choice questions

  @IsOptional()
  @IsString()
  text_answer?: string; // For question-answer questions
}

export class SubmitQuizAttemptDto {
  @IsInt()
  quiz_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @IsOptional()
  answers: AnswerDto[];
}

export class CreateSubmitQuizAttemptDto {
  @IsInt()
  @IsNotEmpty()
  quiz_id: number;
}