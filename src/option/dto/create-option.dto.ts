// src/dto/Option.dto.ts
import { IsNotEmpty, IsBoolean, IsNumber, IsOptional } from 'class-validator';


export class EditOptionDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class OptionDto {
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}