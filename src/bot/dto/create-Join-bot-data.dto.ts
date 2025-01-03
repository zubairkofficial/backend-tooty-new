import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteBotContextDto {

    @ApiProperty({
        description: 'The bot ID to delete',
        example: 1,
    })
    @IsNumber()
    bot_id: number;

    @ApiProperty({
        description: 'The file ID associated with the bot context',
        example: 1001,
    })
    @IsNumber()
    file_id: number;
}

export class CreateBotContextDto {

    @ApiProperty({
        description: 'The bot ID to create context for',
        example: 1,
    })
    @IsNumber()
    bot_id: number;

    @ApiProperty({
        description: 'The file ID associated with the bot context',
        example: 1001,
    })
    @IsNumber()
    file_id: number;
}

export class UpdateBotContextDto {

    @ApiProperty({
        description: 'The bot ID to update context for',
        example: 1,
    })
    @IsNumber()
    bot_id: number;

    @ApiProperty({
        description: 'The file ID associated with the bot context to update',
        example: 1001,
    })
    @IsNumber()
    file_id: number;
}

export class GetBotContextDto {

    @ApiProperty({
        description: 'The bot ID to retrieve context for',
        example: 1,
    })
    @IsNumber()
    bot_id: number;
}
