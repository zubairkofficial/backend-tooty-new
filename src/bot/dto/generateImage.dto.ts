import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageDto {

    @ApiProperty({
        description: 'The unique chat ID associated with the image generation request',
        example: 123,
    })
    @IsNumber()
    chat_id: number;

    @ApiProperty({
        description: 'The answer or input to generate the image from',
        example: 'Generate a futuristic city skyline',
    })
    @IsString()
    @IsNotEmpty({ message: 'Answer should not be empty' })
    answer: string;

    @ApiProperty({
        description: 'The unique bot ID for the bot requesting the image generation',
        example: 1,
    })
    @IsNumber()
    bot_id: number;
}
