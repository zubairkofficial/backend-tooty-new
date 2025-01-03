import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({
    description: 'The unique identifier of the bot involved in the chat',
    example: 123,
  })
  @IsNumber()
  bot_id: number;

  @ApiProperty({
    description: 'The URL of the image associated with the chat (if any)',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional() // Optional if image is not always required
  image_url: string;

  @ApiProperty({
    description: 'The message being sent in the chat',
    example: 'Hello, how can I assist you?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  // Uncomment if `is_bot` is required for the API
  // @ApiProperty({
  //   description: 'Indicates if the message is from a bot or not',
  //   example: true,
  // })
  // @IsNotEmpty()
  // is_bot: boolean;
}
