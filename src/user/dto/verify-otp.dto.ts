import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The OTP received via email',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Email address associated with the OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
