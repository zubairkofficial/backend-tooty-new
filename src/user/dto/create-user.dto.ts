import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/utils/roles.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique identifier for the user', example: 1 })
  readonly id: number;

  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  @IsString({ message: 'Name should be a string' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiProperty({ description: 'Email address of the user', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({ description: 'Password for the user account', example: 'strongpassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Contact number of the user', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  contact: string;
}

export class DeleteUserDto {
  @ApiProperty({ description: 'ID of the user to delete', example: 1 })
  @IsNumber()
  user_id: number;
}


export class CreateAdminBySuperAdminDto {
  @ApiProperty({ description: 'Name of the user', example: 'Jane Doe' })
  @IsString({ message: 'Name should be a string' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiProperty({ description: 'Email address of the user', example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({ description: 'Password for the user account', example: 'adminpassword123' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Contact number of the user', example: '+9876543210' })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({ description: 'Role of the user', enum: Role, example: Role.ADMIN })
  @IsString()
  @IsNotEmpty()
  role: Role;


  @ApiProperty({ description: 'admin is the admin to School: school_id', example: 1 })
  @IsNumber()
  school_id: number;

}

export class CreateUserByAdminDto {
  @ApiProperty({ description: 'Name of the user', example: 'Jane Doe' })
  @IsString({ message: 'Name should be a string' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiProperty({ description: 'Email address of the user', example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({ description: 'Password for the user account', example: 'adminpassword123' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Contact number of the user', example: '+9876543210' })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({ description: 'Role of the user', enum: Role, example: Role.ADMIN })
  @IsString()
  @IsNotEmpty()
  role: Role;

  @ApiProperty({ description: 'ID of the user level', example: 3 })
  @IsOptional()
  @IsNumber()
  level_id: number;

  @ApiProperty({ description: 'ID of the user paretn', example: 3 })
  @IsOptional()
  @IsNumber()
  parent_id: number;

  @ApiProperty({ description: 'Roll number of the user', example: 'ROLL123' })
  user_roll_no: string;
}

export class UserLoginDto {
  @ApiProperty({ description: 'Email address of the user', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @ApiProperty({ description: 'Password for the user account', example: 'userpassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserLogoutDto {
  @ApiProperty({ description: 'Refresh token of the user session', example: 'refresh_token_123' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class GetUserDto {
  @ApiProperty({ description: 'ID of the user to fetch', example: 1 })
  @IsNumber()
  user_id: number;
}

export class RefreshAccessToken {
  @ApiProperty({ description: 'Refresh token for generating a new access token', example: 'refresh_token_456' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
