import { SubjectService } from './subject.service';
import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { GetSubjectDto, UpdateSubjectDto, CreateSubjectDto, GetSubjectByLevelDto } from './dto/subject.dto';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('subject')
export class SubjectController {

    constructor(private readonly subjectServices: SubjectService) { }

    // For Teacher
    @ApiOperation({ summary: 'Get subjects assigned to the teacher' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved subjects by teacher.' })
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('get-subjects-by-teacher')
    async getSubjectsByTeacher(@Req() req: any) {
        return this.subjectServices.getSubjectsByTeacher(req);
    }

    // For Admin

    @ApiOperation({ summary: 'Get subjects by level' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved subjects by level.' })
    @ApiBody({ type: GetSubjectByLevelDto })
    @Roles(Role.ADMIN, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('get-subjects-by-level')
    async getSubjectsByLevel(@Body() getSubjectByLevelDto: GetSubjectByLevelDto, @Req() req: any) {
        return this.subjectServices.getSubjectsByLevel(getSubjectByLevelDto);
    }

    @ApiOperation({ summary: 'Get a subject by ID' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved the subject.' })
    @ApiBody({ type: GetSubjectDto })
    @Roles(Role.ADMIN, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('get-subject')
    async getSubject(@Body() getSubjectDto: GetSubjectDto, @Req() req: any) {
        return this.subjectServices.getSubject(getSubjectDto);
    }


    @ApiOperation({ summary: 'Get all subjects' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved all subjects.' })
    @Roles(Role.ADMIN, Role.TEACHER, Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('get-all-subjects')
    async getAllSubjects(
        @Req() req: any,
        @Query('page') page?: number , // Default to page 1
        @Query('limit') limit?: number , // Default to 10 items per page
    ) {
        return this.subjectServices.getAllSubjects({ page, limit });
    }
    @ApiOperation({ summary: 'Update a subject' })
    @ApiResponse({ status: 200, description: 'Successfully updated the subject.' })
    @ApiBody({ type: UpdateSubjectDto })
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put('update-subject')
    async updateSubject(@Body() updateSubjectDto: UpdateSubjectDto, @Req() req: any) {
        return this.subjectServices.updateSubject(updateSubjectDto);
    }

    @ApiOperation({ summary: 'Create a new subject' })
    @ApiResponse({ status: 201, description: 'Successfully created the subject.' })
    @ApiBody({ type: CreateSubjectDto })
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('create-subject')
    async createSubject(@Body() createSubjectDto: CreateSubjectDto, @Req() req: any) {
        return this.subjectServices.createSubject(createSubjectDto);
    }
}
