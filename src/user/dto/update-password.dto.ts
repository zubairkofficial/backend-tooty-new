import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Email address of the user resetting their password',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({
    description: 'OTP received for password reset',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'OTP should not be empty' })
  otp: string;

  @ApiProperty({
    description: 'New password to set for the user',
    example: 'securePassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password should not be empty' })
  password: string;
}
