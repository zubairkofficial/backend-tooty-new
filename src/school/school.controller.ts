import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { SchoolsService } from './school.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('school') // Swagger tag for grouping
@Controller('school')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

  // Create a new school
  @Post()
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async createSchool(@Body() createSchoolDto: CreateSchoolDto) {
    try {
      const school = await this.schoolsService.createSchool(createSchoolDto);
      return { status: HttpStatus.OK, message: 'School created successfully', data: school };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create school',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  // Get school by admin
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get SCHOLL by admin' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schools fetched successfully' })
  async getSchoolByAdmin(@Req() req: any) {
    try {
      const result = await this.schoolsService.getSchoolByAdmin(req);
      return { status: HttpStatus.OK, message: 'Schools fetched successfully', data: result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch schools',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  // Get all schools with pagination
  @Get('get-all-schools')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all schools' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schools fetched successfully' })
  async getAllSchools(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const result = await this.schoolsService.getAllSchools(page, limit);
      return { status: HttpStatus.OK, message: 'Schools fetched successfully', data: result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch schools',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a school by ID
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get a school by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School fetched successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async getSchoolById(@Param('id') id: string) {
    try {
      const school = await this.schoolsService.getSchoolById(+id);
      return { status: HttpStatus.OK, message: 'School fetched successfully', data: school };
    } catch (error) {
      throw new HttpException(
        error.message || 'School not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Update a school by ID
  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a school by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'School updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  async updateSchool(
    @Param('id') id: number,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    try {
      const school = await this.schoolsService.updateSchool(id, updateSchoolDto);
      return { status: HttpStatus.OK, message: 'School updated successfully', data: school };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update school',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delete a school by ID (soft delete)
  // @Delete(':id')
  // @Roles(Role.SUPER_ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Delete a school by ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'School deleted successfully' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  // async deleteSchool(@Param('id') id: number) {
  //   try {
  //     await this.schoolsService.deleteSchool(id);
  //     return { status: HttpStatus.OK, message: 'School deleted successfully' };
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to delete school',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // Restore a soft-deleted school by ID
  // @Post(':id/restore')
  // @Roles(Role.SUPER_ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiOperation({ summary: 'Restore a soft-deleted school by ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'School restored successfully' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School not found' })
  // async restoreSchool(@Param('id') id: number) {
  //   try {
  //     await this.schoolsService.restoreSchool(id);
  //     return { status: HttpStatus.OK, message: 'School restored successfully' };
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to restore school',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}