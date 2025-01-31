import { HttpException, Injectable } from '@nestjs/common';

import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';
import { District } from './entity/district.entity';

@Injectable()
export class DistrictService {

    async createDistrict(createDistrictDto: CreateDistrictDto) {
        try {
            await District.create({
                name: createDistrictDto.name
            });

            return {
                statusCode: 200,
                message: "District created successfully"
            };
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Failed to create District',
                error.statusCode || 500
            );
        }
    }

    async updateDistrict(updateDistrictDto: UpdateDistrictDto) {
        try {
            const district = await District.findByPk(updateDistrictDto.id);
            if (!district) {
                throw new HttpException('District not found', 404);
            }

            await district.update({
                name: updateDistrictDto.name
            });

            return {
                statusCode: 200,
                message: "District updated successfully"
            };
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Failed to update District',
                error.statusCode || 500
            );
        }
    }

    async getDistrictById(id: string) {
        try {
            const district = await District.findByPk(id);
            if (!district) {
                throw new HttpException('District not found', 404);
            }

            return {
                statusCode: 200,
                data: district
            };
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Failed to fetch District',
                error.statusCode || 500
            );
        }
    }

    async getAllDistricts() {
        try {
            const districts = await District.findAll();

            return {
                statusCode: 200,
                data: districts
            };
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Failed to fetch Districts',
                error.statusCode || 500
            );
        }
    }
}