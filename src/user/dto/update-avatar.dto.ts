import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file',
  })
  @IsNotEmpty()
  image: any;  // Use 'any' type here because the file will be handled as a stream or buffer
}
