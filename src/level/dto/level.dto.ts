import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateLevelDto {

    @ApiProperty({ 
        description: 'The name of the level', 
        example: 'Level 1' 
    })
    @IsString()
    @IsNotEmpty()
    level: string;

    @ApiProperty({ 
        description: 'A description of the level', 
        example: 'This is the first level in the course progression' 
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}

export class GetLevelDto {

    @ApiProperty({ 
        description: 'The ID of the level to retrieve', 
        example: 1 
    })
    @IsNumber()
    level_id: number;
}

export class UpdateLevelDto {

    @ApiProperty({ 
        description: 'The new description for the level', 
        example: 'Updated level description', 
        required: false 
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string;

    @ApiProperty({ 
        description: 'The new name for the level', 
        example: 'Level 2', 
        required: false 
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    level?: string;
}
