import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contact: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  oldPassword: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newPassword: string

}
export class UpdateUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
    required: false,
  })
 
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
  })

 
  @IsString({ message: 'Name should be a string' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: false,
  })

 
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contact number of the user',
    example: '+1234567890',
    required: false,
  })
  
  @IsString({ message: 'Contact should be a string' })
  @IsNotEmpty()
  contact: string;

  @ApiProperty({
    description: 'Verification status of the user',
    example: true,
    required: false,
  })

  @IsBoolean({ message: 'isVerified should be a boolean' })
  isVerified: boolean;



}