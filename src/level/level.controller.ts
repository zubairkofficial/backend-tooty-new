import { Body, Controller, Get, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LevelService } from './level.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateLevelDto, GetLevelDto, UpdateLevelDto } from './dto/level.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('level')
export class LevelController {

    constructor(private readonly levelServices: LevelService) { }

    @Post('get-level')
    @Roles(Role.ADMIN, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get a specific level by its ID' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved the level' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getLevel(@Body() getLevelDto: GetLevelDto, @Req() req: any) {
        return this.levelServices.getLevel(getLevelDto, req);
    }

    @Get('get-all-levels')
    @Roles(Role.ADMIN, Role.TEACHER, Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all levels with pagination' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved all levels' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getAllLevels(
        @Req() req: any,
        @Query('page') page?: number, // Optional query parameter
        @Query('limit') limit?: number, // Optional query parameter
    ) {
        return this.levelServices.getAllLevels({ page, limit }, req);
    }

    @Put('update-level')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update a level' })
    @ApiResponse({ status: 200, description: 'Successfully updated the level' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateLevel(@Body() updateLevelDto: UpdateLevelDto, @Req() req: any) {
        return this.levelServices.updateLevel(updateLevelDto, req);
    }

    @Post('create-level')
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a new level' })
    @ApiResponse({ status: 201, description: 'Successfully created the level' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async createLevel(@Body() createLevelDto: CreateLevelDto, @Req() req: any) {
        return this.levelServices.createLevel(createLevelDto, req);
    }
}
