import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';  // Swagger decorators
import { UpdateStudentProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { GetStudentProfileDto } from './dto/get-profile.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateJoinTeacherSubjectLevel, DeleteJoinTeacherSubjectLevel, GetJoinsTeacherSubjectLevelDto, GetTeacherProfileDto, UpdateTeacherProfileDto } from './dto/teacher-profile.dto';
import { UpdateAdminProfileDto, UpdateSuperAdminDto } from './dto/admin.dto';

@ApiTags('Profile') // Grouping the routes for 'Profile'
@ApiBearerAuth()  // Add this if you're using JWT authentication
@Controller('profile')
export class ProfileController {

  constructor(private readonly profileServices: ProfileService) { }


  @Get('get-all-children')
  @Roles(Role.PARENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Super Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved super admin profile.' })
  async getChildren(@Req() req: any) {
    return this.profileServices.getChildren(req);
  }
 
  @Get('get-children/:child_id')
  @Roles(Role.PARENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Super Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved super admin profile.' })
  async getChildrenById(@Req() req: any,@Param() params) {
    return this.profileServices.getChildrenById(params,req);
  }

  //Super admin management

  @Get('get-superadmin-profile')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Super Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved super admin profile.' })
  async getSuperAdminProfile(@Req() req: any) {
    return this.profileServices.getSuperAdminProfile(req);
  }

  @Put('update-superadmin-profile')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update super Admin Profile' })
  @ApiResponse({ status: 200, description: ' super Admin profile updated successfully.' })
  async updateSuperAdminProfile(@Body() updateAdminProfileDto: UpdateSuperAdminDto, @Req() req: any) {
    return this.profileServices.updateSuperAdmin(updateAdminProfileDto, req);
  }

  //Parent Management
  @Get('get-parent-profile/:parent_id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved admin profile.' })
  async getParentProfile(@Param('parent_id') parent_id: string, @Req() req: any) {

    return this.profileServices.getParentByID(Number(parent_id), req);
  }
  
  // Admin Management

  @Get('get-all-admins')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Admin All Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved admin profile.' })
  async getAllAdmins(@Req() req: any) {
    return this.profileServices.getAllAdmins(req);
  }

  @Get('get-admin-profile/:admin_id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved admin profile.' })
  async getAdminProfile(@Param() params: { admin_id: string }, @Req() req: any) {
    const { admin_id } = params
    return this.profileServices.getAdminProfile(admin_id, req);
  }

  @Put('update-admin-profile')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update super Admin Profile' })
  @ApiResponse({ status: 200, description: ' super Admin profile updated successfully.' })
  async updateAdminProfile(@Body() updateAdminProfileDto: UpdateAdminProfileDto, @Req() req: any) {
    return this.profileServices.updateAdmin(updateAdminProfileDto, req);
  }
  // Teacher Management
  @Post('create-join-teacher-subject-level')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create Teacher-Subject-Level Join' })
  @ApiResponse({ status: 201, description: 'Teacher-Subject-Level join created.' })
  async createJoinTeacherSubjectLevel(
    @Body() createJoinTeacherSubjectLevelDto: CreateJoinTeacherSubjectLevel,
    @Req() req: any
  ) {
    try {
      // Call the service method
      const response = await this.profileServices.createJoinTeacherSubjectLevel(createJoinTeacherSubjectLevelDto, req);
      return response; // Return the successful response
    } catch (error) {
      // Handle any errors that occur
      console.error(error);
      return {
        statusCode: 500,
        message: error.message || 'An error occurred while creating the teacher-subject-level join.',
      };
    }
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
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getTeacherProfile(
    @Body() getTeacherProfile: GetTeacherProfileDto,
    @Req() req: any,
  ) {
    try {
      const profile = await this.profileServices.getTeacherProfile(getTeacherProfile, req);
      return profile;
    } catch (error) {
      console.error('Error fetching teacher profile:', error.message);
  
      // Generic error response
      throw new HttpException(
        { message: 'Failed to retrieve teacher profile.', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
