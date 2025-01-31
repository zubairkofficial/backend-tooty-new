import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { number } from 'zod';


export class UpdateAdminProfileDto {
    @IsNumber()
    school_id: number

    @IsNumber()
    admin_id: number


    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    contact: string

    @IsString()
    @IsNotEmpty()
    role: string
}

export class UpdateSuperAdminDto {

    @ApiProperty({
        description: 'The OpenAI API key or configuration',
        example: 'sk-xxxxxxxxxxxxxxxx',
    })
    @IsString()
    @IsNotEmpty()
    openai: string;

    @ApiProperty({
        description: 'The DALL·E API key or configuration',
        example: 'sk-xxxxxxxxxxxxxxxx',
    })
    @IsString()
    @IsNotEmpty()
    dalle: string;

    @ApiProperty({
        description: 'The Deepgram API key or configuration',
        example: 'sk-xxxxxxxxxxxxxxxx',
    })
    @IsString()
    @IsNotEmpty()
    deepgram: string;

    @ApiProperty({
        description: 'The master prompt used for AI models',
        example: 'Create an image of a futuristic city',
    })
    @IsString()
    @IsNotEmpty()
    master_prompt: string;
}
