import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';  // Swagger decorators
import { UpdateStudentProfileDto, UpdateTeacherProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { GetStudentProfileDto } from './dto/get-profile.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateJoinTeacherSubjectLevel, DeleteJoinTeacherSubjectLevel, GetJoinsTeacherSubjectLevelDto, GetTeacherProfileDto } from './dto/teacher-profile.dto';
import { AssignSchoolToAdminDto, UpdateAdminProfileDto, UpdateSuperAdminDto } from './dto/admin.dto';
import { Sequelize } from 'sequelize-typescript';

@ApiTags('Profile') // Grouping the routes for 'Profile'
@ApiBearerAuth()  // Add this if you're using JWT authentication
@Controller('profile')
export class ProfileController {

  constructor(private readonly profileServices: ProfileService,

    private readonly sequelize: Sequelize

  ) { }


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
  async getChildrenById(@Req() req: any, @Param() params) {
    return this.profileServices.getChildrenById(params, req);
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

  @Get('get-all-super-intendents')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Admin All Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved admin profile.' })
  async getAllSuperIntendents(@Req() req: any) {
    return this.profileServices.getAllSuperIntendents(req);
  }


  @Get('get-all-admins')
  @Roles(Role.SUPER_INTENDENT)
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

  @Put('update-school-assignment')
  @Roles(Role.SUPER_INTENDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update super Admin school' })
  @ApiResponse({ status: 200, description: ' super Admin profile updated successfully.' })
  async updateAdminSchool(@Body() assassignSchoolToAdminDto: AssignSchoolToAdminDto, @Req() req: any) {
    return this.profileServices.assignSchoolToAdmin(assassignSchoolToAdminDto);
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




  @Get('get-student/:student_id')
  @Roles(Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Super Admin Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved super admin profile.' })
  async getStudentById(@Req() req: any, @Param() params) {
    return this.profileServices.getStudentById(params, req);
  }

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


  @Post('get-student-profile')
  @Roles(Role.ADMIN, Role.USER, Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Student Profile' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved student profile.' })
  async getStudentProfile(@Body() getProfileDto: GetStudentProfileDto, @Req() req: any) {
    return this.profileServices.getStudentProfile(getProfileDto, req);
  }


  @Put('fill-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Fill user profile based on role' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async fillProfile(@Body() updateProfileDto: any, @Req() req: any) {
    try {
      const userRole = req.user.role; // Role from JWT
      let result: any;

      // Transaction for atomic updates
      await this.sequelize.transaction(async (transaction) => {
        if (userRole === Role.ADMIN) {
          if (updateProfileDto.level_id && updateProfileDto.user_roll_no && updateProfileDto.parent_id) {
            result = await this.profileServices.updateStudentProfile(updateProfileDto, req, transaction);
          } else if (updateProfileDto.level_id && updateProfileDto.title) {
            result = await this.profileServices.updateTeacherProfile(updateProfileDto, req, transaction);
          } else {
            throw new HttpException('Invalid payload for ADMIN', HttpStatus.BAD_REQUEST);
          }
        } else if (userRole === Role.SUPER_ADMIN) {
          if (updateProfileDto.district_id) {
            result = await this.profileServices.updateSuperIntendentProfile(updateProfileDto, req, transaction);
          } else {
            throw new HttpException('Invalid payload for SUPER_ADMIN', HttpStatus.BAD_REQUEST);
          }
        } else if (userRole === Role.SUPER_INTENDENT) {
          if (updateProfileDto.school_id) {
            result = await this.profileServices.updateAdminProfile(updateProfileDto, req, transaction);
          } else {
            throw new HttpException('Invalid payload for SUPER_INTENDENT', HttpStatus.BAD_REQUEST);
          }
        } else {
          throw new HttpException('Role not allowed to fill profile', HttpStatus.FORBIDDEN);
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Profile updated successfully",
        data: result,
      };
    } catch (error) {
      console.error('Error in fillProfile:', error);
      throw new HttpException(error.message || "Error updating profile", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
