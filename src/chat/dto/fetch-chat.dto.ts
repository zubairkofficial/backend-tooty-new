import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FetchChatDto {
  @ApiProperty({
    description: 'The unique identifier of the bot for which the chat is being fetched',
    example: 123,
  })
  @IsNumber()
  @IsNotEmpty()
  bot_id: number;

  @IsNumber()
  @IsNotEmpty()
  page: number

  
  @IsNumber()
  @IsNotEmpty()
  limit: number
}

export class FetchChatHistoryDto {
  @ApiProperty({
    description: 'The unique identifier of the user whose chat history is being fetched',
    example: 456,
  })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({
    description: 'The unique identifier of the bot whose chat history is being fetched',
    example: 123,
  })
  @IsNumber()
  @IsNotEmpty()
  bot_id: number;

  @IsNumber()
  @IsNotEmpty()
  page: number

  
  @IsNumber()
  @IsNotEmpty()
  limit: number
}
