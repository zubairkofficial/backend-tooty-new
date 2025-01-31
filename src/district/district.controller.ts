import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { DistrictService } from './district.service';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';
import { Role } from 'src/utils/roles.enum';

@Controller('district')
export class DistrictController {

    constructor(
        private readonly districtService: DistrictService
    ) { }

    @Post("")
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createDistrict(@Body() createDistrictDto: CreateDistrictDto) {
        return this.districtService.createDistrict(createDistrictDto);
    }

    @Put("")
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateDistrict(@Body() updateDistrictDto: UpdateDistrictDto) {
        return this.districtService.updateDistrict(updateDistrictDto);
    }

    @Get(":id")
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getDistrictById(@Param('id') id: string) {
        return this.districtService.getDistrictById(id);
    }

    @Get("")
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getAllDistricts() {
        return this.districtService.getAllDistricts();
    }
}