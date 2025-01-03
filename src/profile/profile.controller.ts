import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';  // Swagger decorators
import { UpdateStudentProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { GetStudentProfileDto } from './dto/get-profile.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateJoinTeacherSubjectLevel, DeleteJoinTeacherSubjectLevel, GetJoinsTeacherSubjectLevelDto, GetTeacherProfileDto, UpdateTeacherProfileDto } from './dto/teacher-profile.dto';
import { GetStudentsByLevelDto } from './dto/get-student.dto';
import { UpdateAdminDto } from './dto/admin.dto';

@ApiTags('Profile') // Grouping the routes for 'Profile'
@ApiBearerAuth()  // Add this if you're using JWT authentication
@Controller('profile')
export class ProfileController {

  constructor(private readonly profileServices: ProfileService) { }

  // Admin Management
  @Get('get-admin-profile')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved admin profile.' })
  async getAdminProfile(@Req() req: any) {
    return this.profileServices.getAdminProfile(req);
  }

  @Put('update-admin-profile')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update Admin Profile' })
  @ApiResponse({ status: 200, description: 'Admin profile updated successfully.' })
  async updateAdminProfile(@Body() updateAdminProfileDto: UpdateAdminDto, @Req() req: any) {
    return this.profileServices.updateAdmin(updateAdminProfileDto, req);
  }

  // Teacher Management
  @Post('create-join-teacher-subject-level')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create Teacher-Subject-Level Join' })
  @ApiResponse({ status: 201, description: 'Teacher-Subject-Level join created.' })
  async createJoinTeacherSubjectLevel(@Body() createJoinTeacherSubjectLevelDto: CreateJoinTeacherSubjectLevel, @Req() req: any) {
    return this.profileServices.createJoinTeacherSubjectLevel(createJoinTeacherSubjectLevelDto, req);
  }

  @Delete('delete-join-teacher-subject-level')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete Teacher-Subject-Level Join' })
  @ApiResponse({ status: 200, description: 'Teacher-Subject-Level join deleted successfully.' })
  async deleteJoinTeacherSubjectLevel(@Body() deleteJoinTeacherSubjectLevelDto: DeleteJoinTeacherSubjectLevel, @Req() req: any) {
    return this.profileServices.deleteJoinTeacherSubjectLevel(deleteJoinTeacherSubjectLevelDto, req);
  }

  @Post('get-join-teacher-subject-level')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Teacher-Subject-Level Join' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved teacher-subject-level join.' })
  async getJoinTeacherSubjectLevel(@Body() getJoinTeacherSubjectLevelDto: GetJoinsTeacherSubjectLevelDto, @Req() req: any) {
    return this.profileServices.getJoinTeacherSubjectLevel(getJoinTeacherSubjectLevelDto, req);
  }

  @Put('fill-teacher-profile')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Fill Teacher Profile' })
  @ApiResponse({ status: 200, description: 'Teacher profile filled successfully.' })
  async fillTeacherProfile(@Body() updateTeacherProfileDto: UpdateTeacherProfileDto, @Req() req: any) {
    return this.profileServices.updateTeacherProfile(updateTeacherProfileDto, req);
  }

  @Post('get-teacher-profile')
  @Roles(Role.ADMIN, Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Teacher Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved teacher profile.' })
  async getTeacherProfile(@Body() getTeacherProfile: GetTeacherProfileDto, @Req() req: any) {
    return this.profileServices.getTeacherProfile(getTeacherProfile, req);
  }

  // Students Management
  @Get('get-students-by-level')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Students by Level' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved students by level.' })
  async getStudentsByLevel(@Req() req: any) {
    return this.profileServices.getStudentsByLevel(req);
  }

  @Put('fill-student-profile')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Fill Student Profile' })
  @ApiResponse({ status: 200, description: 'Student profile filled successfully.' })
  async fillStudentProfile(@Body() updateProflieDto: UpdateStudentProfileDto, @Req() req: any) {
    return this.profileServices.updateStudentProfile(updateProflieDto, req);
  }

  @Post('get-student-profile')
  @Roles(Role.ADMIN, Role.USER, Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Student Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved student profile.' })
  async getStudentProfile(@Body() getProfileDto: GetStudentProfileDto, @Req() req: any) {
    return this.profileServices.getStudentProfile(getProfileDto, req);
  }
}
