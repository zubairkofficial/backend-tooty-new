import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  @IsString({ message: 'Name should be a string' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({
    description: 'Contact number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({
    description: 'Verification status of the user',
    example: true,
  })
  @IsBoolean()
  isVerified: boolean;
}
