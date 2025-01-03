import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBotDto {

    @ApiProperty({
        description: 'The name of the bot',
        example: 'ChatBot A',
    })
    @IsString({ message: 'name should be string' })
    @IsNotEmpty({ message: 'name should not be empty' })
    name: string;

    @ApiProperty({
        description: 'The display name of the bot',
        example: 'ChatBot A Display Name',
    })
    @IsString({ message: 'display_name should be string' })
    @IsNotEmpty({ message: 'display_name should not be empty' })
    display_name: string;

    @ApiProperty({
        description: 'A description of the bot',
        example: 'This bot helps with customer service inquiries.',
    })
    @IsString({ message: 'description should be string' })
    @IsNotEmpty({ message: 'description should not be empty' })
    description: string;

    @ApiProperty({
        description: 'The voice model used by the bot',
        example: 'Google WaveNet',
    })
    @IsString({ message: 'voice_model should be string' })
    @IsNotEmpty({ message: 'voice_model should not be empty' })
    voice_model: string;

    @ApiProperty({
        description: 'The AI model used by the bot',
        example: 'GPT-3',
    })
    @IsString()
    @IsNotEmpty({ message: 'ai_model should not be empty' })
    ai_model: string;

    @ApiProperty({
        description: 'The level ID that the bot operates at',
        example: 1,
    })
    @IsString()
    @IsNotEmpty()
    level_id: number;

    @ApiProperty({
        description: 'The subject ID for the bot',
        example: 101,
    })
    @IsString()
    @IsNotEmpty()
    subject_id: number;

    @ApiProperty({
        description: 'The file ID associated with the bot',
        example: 1001,
    })
    @IsString()
    @IsNotEmpty()
    file_id: number;
}

export class UpdateBotDto {

    @ApiProperty({
        description: 'The bot ID',
        example: 1,
    })
    @IsNumber()
    id: number;

    @ApiProperty({
        description: 'The name of the bot',
        example: 'Updated ChatBot A',
    })
    @IsString({ message: 'name should be string' })
    @IsNotEmpty({ message: 'name should not be empty' })
    name: string;

    @ApiProperty({
        description: 'The display name of the bot',
        example: 'Updated Display Name',
    })
    @IsString({ message: 'display_name should be string' })
    @IsNotEmpty({ message: 'display_name should not be empty' })
    display_name: string;

    @ApiProperty({
        description: 'A description of the bot',
        example: 'Updated bot description.',
    })
    @IsString({ message: 'description should be string' })
    @IsNotEmpty({ message: 'description should not be empty' })
    description: string;

    @ApiProperty({
        description: 'The voice model used by the bot',
        example: 'Google WaveNet Updated',
    })
    @IsString({ message: 'voice_model should be string' })
    @IsNotEmpty({ message: 'voice_model should not be empty' })
    voice_model: string;

    @ApiProperty({
        description: 'The AI model used by the bot',
        example: 'GPT-4',
    })
    @IsString()
    @IsNotEmpty({ message: 'ai_model should not be empty' })
    ai_model: string;

    @ApiProperty({
        description: 'The level ID that the bot operates at',
        example: 2,
    })
    @IsNumber()
    level_id: number;

    @ApiProperty({
        description: 'The subject ID for the bot',
        example: 102,
    })
    @IsNumber()
    subject_id: number;
}

export class DeleteBotDto {

    @ApiProperty({
        description: 'The bot ID to delete',
        example: 1,
    })
    @IsNumber()
    bot_id: number;
}

export class QueryBot {

    @ApiProperty({
        description: 'The query string for bot search',
        example: 'Find a bot by name or description.',
    })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiProperty({
        description: 'The bot ID for querying',
        example: 1,
    })
    @IsNumber()
    bot_id: number;
}

export class GetBotByLevelSubject {

    @ApiProperty({
        description: 'The subject ID for bot filtering',
        example: 101,
    })
    @IsNumber()
    subject_id: number;

    @ApiProperty({
        description: 'The level ID for bot filtering',
        example: 1,
    })
    @IsNumber()
    level_id: number;
}

export class GetBotDto {

    @ApiProperty({
        description: 'The bot ID for fetching details',
        example: 1,
    })
    @IsNumber()
    bot_id: number;
}

export class GetBotBySubjectDto {

    @ApiProperty({
        description: 'The subject ID for fetching bots',
        example: 101,
    })
    @IsNumber()
    subject_id: number;
}
