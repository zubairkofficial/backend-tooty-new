import { CreateLevelDto, GetLevelDto, UpdateLevelDto } from './dto/level.dto';
import { Level } from './entity/level.entity';
import { Op } from 'sequelize';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/utils/pagination.utils';

export class LevelService {
    private readonly logger = new Logger(LevelService.name);

    async getLevel(getLevelDto: GetLevelDto, req: any) {
        try {
            const level_data = await Level.findByPk(getLevelDto.level_id);

            if (!level_data) {
                throw new HttpException(`Level with id ${getLevelDto.level_id} not found`, HttpStatus.NOT_FOUND);
            }

            return {
                statusCode: 200,
                data: level_data
            };
        } catch (error) {
            this.logger.error(`Failed to get level: ${error.message}`, error.stack);
            throw new HttpException(error.message || 'Failed to get level', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllLevels(paginationDto: { page?: number; limit?: number }, req: any) {
        try {
            const { page, limit } = paginationDto;

            let levels;
            let total;

            if (page && limit) {
                // Pagination logic
                if (page < 1 || limit < 1) {
                    throw new HttpException('Page and limit must be greater than or equal to 1', HttpStatus.BAD_REQUEST);
                }

                const offset = (page - 1) * limit;
                const result = await Level.findAndCountAll({
                    limit,
                    offset,
                    where: {
                        school_id: {
                            [Op.eq]: req.user.school_id
                        }
                    },
                    raw: true,
                });
                levels = result.rows;
                total = result.count;
            } else {
                // Return all levels if page and limit are not provided
                levels = await Level.findAll({
                    where: {
                        school_id: {
                            [Op.eq]: req.user.school_id
                        }
                    },
                    raw: true,
                });
                total = levels.length;
            }

            // Use the paginate helper function to structure the response
            const infoLevel = paginate(levels, total, page || 1, limit || total);

            return {
                statusCode: 200,
                ...infoLevel,
            };
        } catch (error) {
            this.logger.error(`Failed to get all levels: ${error.message}`, error.stack);
            throw new HttpException(error.message || 'Failed to get all levels', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateLevel(updateLevelDto: UpdateLevelDto, req: any) {
        try {
            const [updated] = await Level.update({
                level: updateLevelDto.level,
                description: updateLevelDto.description
            }, {
                where: {
                    id: {
                        [Op.eq]: updateLevelDto.level_id
                    }
                }
            });

            if (updated === 0) {
                throw new HttpException(`Level with id ${updateLevelDto.level} not found`, HttpStatus.NOT_FOUND);
            }

            return {
                statusCode: 200,
                message: "Successfully updated level"
            };
        } catch (error) {
            this.logger.error(`Failed to update level: ${error.message}`, error.stack);
            throw new HttpException(error.message || 'Failed to update level', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createLevel(createLevelDto: CreateLevelDto, req: any) {
        try {
            await Level.create({
                level: createLevelDto.level,
                description: createLevelDto.description,
                school_id: req.user.school_id
            });

            return {
                statusCode: 200,
                message: "Successfully created new level"
            };
        } catch (error) {
            this.logger.error(`Failed to create new level: ${error.message}`, error.stack);
            throw new HttpException(error.message || 'Failed to create new level', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
