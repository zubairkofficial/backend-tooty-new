import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Role } from 'src/utils/roles.enum';


export class CreateUserByAdminDto {
  @ApiProperty({ example: 'John Doe' }) @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: 'john.doe@example.com' }) @IsEmail() @IsNotEmpty() email: string;
  @ApiProperty({ example: 'password123' }) @IsString() @IsNotEmpty() password: string;
  @ApiProperty({ example: '+1234567890' }) @IsString() @IsNotEmpty() contact: string;
  @ApiProperty({ example: Role.ADMIN, enum: Role }) @IsString() @IsNotEmpty() role: Role;

  @ApiProperty({ example: 1, required: false }) @IsOptional() @IsNumber() district_id?: number;
  @ApiProperty({ example: 2, required: false }) @IsOptional() @IsNumber() school_id?: number;
  @ApiProperty({ example: 3, required: false }) @IsOptional() @IsNumber() level_id?: number;
  @ApiProperty({ example: [101, 102], required: false }) @IsOptional() subjects?: number[];
  @ApiProperty({ example: 4, required: false }) @IsOptional() @IsNumber() parent_id?: number;
  @ApiProperty({ example: 'ROLL123', required: false }) @IsOptional() @IsString() user_roll_no?: string;
}

// Base User DTO with common properties
export class BaseUserDto {
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
}

// Create User DTO
export class CreateUserDto extends BaseUserDto {
  @ApiProperty({ description: 'Unique identifier for the user', example: 1 })
  readonly id: number;
}

// Update User DTO (extends BaseUserDto with optional fields)
export class UpdateUserDto extends PartialType(BaseUserDto) {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
    required: false,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Verification status of the user',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'isVerified should be a boolean' })
  isVerified: boolean;
}



// User Login DTO
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

// User Logout DTO
export class UserLogoutDto {
  @ApiProperty({ description: 'Refresh token of the user session', example: 'refresh_token_123' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

// Get User DTO
export class GetUserDto {
  @ApiProperty({ description: 'ID of the user to fetch', example: 1 })
  @IsNumber()
  user_id: number;
}

// Refresh Access Token DTO
export class RefreshAccessToken {
  @ApiProperty({ description: 'Refresh token for generating a new access token', example: 'refresh_token_456' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

// Update Profile DTO
export class UpdateProfileDto {
  @ApiProperty({ description: 'Name of the user', example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Contact number of the user', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({ description: 'Old password for verification', example: 'oldpassword123', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: 'New password to update', example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

// Delete User DTO
export class DeleteUserDto {
  @ApiProperty({ description: 'ID of the user to delete', example: 1 })
  @IsNumber()
  user_id: number;
}