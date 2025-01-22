import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
    @ApiProperty({ description: 'The title of the subject', example: 'Mathematics' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The display title of the subject', example: 'Math' })
    @IsString()
    @IsNotEmpty()
    display_title: string;

    @ApiProperty({ description: 'The description of the subject', example: 'This is a subject about basic mathematics' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'The ID of the level associated with the subject', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    level_id: number;

}

export class GetSubjectByLevelDto {
    @ApiProperty({ description: 'The level ID to filter subjects', example: 2 })
    @IsNumber()
    level_id: number
}

export class GetSubjectDto {
    @ApiProperty({ description: 'The ID of the subject to retrieve', example: 1 })
    @IsNumber()
    subject_id: number
}

export class UpdateSubjectDto {
    @ApiProperty({ description: 'The ID of the subject to update', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    id: number;

    @ApiProperty({ description: 'The title of the subject', example: 'Mathematics' })
    @IsString()
   
    title?: string;

    @ApiProperty({ description: 'The display title of the subject', example: 'Adv. Math' })
    @IsString()
    
    display_title?: string;

    @ApiProperty({ description: 'The description of the subject', example: 'This is a subject about advanced mathematics' })
    @IsString()
   
    description?: string;

    @ApiProperty({ description: 'The ID of the level associated with the subject', example: 2 })
    @IsNumber()
   
    level_id?: number;

  
}