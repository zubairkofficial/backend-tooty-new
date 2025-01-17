import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name should be a string' })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Contact number of the user',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Contact should be a string' })
  contact: string;

  @ApiProperty({
    description: 'Verification status of the user',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isVerified should be a boolean' })
  isVerified: boolean;

  @ApiProperty({
    description: 'Admin verification status of the user',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_verified_by_admin should be a boolean' })
  is_verified_by_admin: boolean;

  @ApiProperty({
    description: 'Old password of the user',
    example: 'oldPassword123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Old password should be a string' })
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword: string;

  @ApiProperty({
    description: 'New password of the user',
    example: 'newPassword123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'New password should be a string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}