import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateAdminDto {

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
