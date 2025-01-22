// src/dto/Option.dto.ts
import { IsNotEmpty, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';


export class EditOptionDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsOptional()
  
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