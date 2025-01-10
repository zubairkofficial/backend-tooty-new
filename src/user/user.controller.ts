import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  UseInterceptors,
  UploadedFile,
  Delete,
  BadRequestException,
  Put,
  Query,
  Res
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateAdminBySuperAdminDto,
  CreateUserByAdminDto,
  CreateUserDto,
  DeleteUserDto,
  GetUserDto,
  RefreshAccessToken,
  UserLoginDto,
  UserLogoutDto,
} from './dto/create-user.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerStorageConfig } from 'src/config/multer.config';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('auth') // Grouping for Swagger
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Put('update-avatar')
  @Roles(Role.ADMIN, Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('avatar', multerStorageConfig)) // Ensure property matches Swagger
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @ApiResponse({ status: 400, description: 'No image uploaded' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['avatar'], // Ensure property matches `@UploadedFile()`
    },
  })
  async updateAvatar(@UploadedFile() avatar: Express.Multer.File, @Req() req: any) {
    if (!avatar) {
      throw new BadRequestException('No image uploaded');
    }
    return this.userService.updateAvatar(avatar, req.user);
  }


  @Post('get-user')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token') // JWT Bearer authentication
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Body() getUserDto: GetUserDto, @Req() req: any) {
    return this.userService.getUser(getUserDto, req);
  }


  @Get('get-all-parents')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Get all parents' })
  @ApiResponse({ status: 200, description: 'Teachers parents' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getAllParents(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.userService.getAllUsersByRole(Role.PARENT, req, page, limit);
  }

  @Get('get-all-teachers')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiResponse({ status: 200, description: 'Teachers retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getAllTeachers(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.userService.getAllUsersByRole(Role.TEACHER, req, page, limit);
  }

  @Get('get-all-students')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Get all students' })
  @ApiResponse({ status: 200, description: 'Students retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getAllStudents(@Req() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.userService.getAllUsersByRole(Role.USER, req, page, limit);
  }


  // it belongs to super admin to create admin
  @Post('create-admin')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Create a admin by super_admin' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  async createAdmin(@Body() createAdminBySuperAdminDto: CreateAdminBySuperAdminDto) {
    return this.userService.createAdmin(createAdminBySuperAdminDto);
  }

  ///this belongs to the admin of school to create user, teacher etc..
  @Post('create-user')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Create a user by admin' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserByAdminDto: CreateUserByAdminDto, @Req() req: any) {
    return this.userService.createUser(createUserByAdminDto, req);
  }
  @Delete('delete-parent')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteParent(@Body() deleteUserDto: DeleteUserDto) {
    return this.userService.deleteParent(deleteUserDto);
  }

  @Delete('delete-user')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Body() deleteUserDto: DeleteUserDto) {
    return this.userService.deleteUser(deleteUserDto);
  }

  @Delete('delete-teacher')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Delete a teacher' })
  @ApiResponse({ status: 200, description: 'Teacher deleted successfully' })
  async deleteTeacher(@Body() deleteUserDto: DeleteUserDto) {
    return this.userService.deleteTeacher(deleteUserDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
  async signup(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    return this.userService.signup(createUserDto, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() userLoginDto: UserLoginDto) {
    return this.userService.login(userLoginDto);
  }

  @Post('logout')
  @Roles(Role.USER, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN, Role.PARENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Body() userLogoutDto: UserLogoutDto) {
    return this.userService.logout(userLogoutDto);
  }

  @Post('refresh-access-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshAccessToken(@Body() refreshAccessToken: RefreshAccessToken) {
    return this.userService.refreshAccessToken(refreshAccessToken);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async send(@Body() sendOtpDto: SendOtpDto) {
    return await this.userService.sendOtpToEmail(sendOtpDto);
  }

  @Put('update-user')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')// JWT Bearer authentication

  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    return await this.userService.updateUser(updateUserDto, req);
  }

  @Put('update-password')
  @ApiBearerAuth('access-token')// JWT Bearer authentication
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto, @Req() req: any) {
    return await this.userService.updatePassword(updatePasswordDto, req);
  }

  @Post('verify-user')
  @ApiOperation({ summary: 'Verify user OTP' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  async verifyUser(@Body() verifyOptDto: VerifyOtpDto) {
    return this.userService.verifyUser(verifyOptDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() verifyOptDto: VerifyOtpDto) {
    return this.userService.verifyOtp(verifyOptDto);
  }
}
