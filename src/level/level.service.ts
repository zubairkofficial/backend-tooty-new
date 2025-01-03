import { CreateLevelDto, GetLevelDto, UpdateLevelDto } from './dto/level.dto';
import { Level } from './entity/level.entity';
import { Op } from 'sequelize';
import { Logger } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/utils/pagination.utils';

export class LevelService {
    private readonly logger = new Logger(LevelService.name);

    async getLevel(getLevelDto: GetLevelDto, req: any) {
        try {
            const level_data = await Level.findByPk(getLevelDto.level_id);

            if (!level_data) {
                throw new Error(`Level with id ${getLevelDto.level_id} not found`);
            }

            return {
                statusCode: 200,
                data: level_data
            };
        } catch (error) {
            this.logger.error(`Failed to get level: ${error.message}`, error.stack);
            throw new Error(`Failed to get level: ${error.message}`);
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
              throw new Error('Page and limit must be greater than or equal to 1');
            }
      
            const offset = (page - 1) * limit;
            const result = await Level.findAndCountAll({
              limit,
              offset,
              raw: true,
            });
            levels = result.rows;
            total = result.count;
          } else {
            // Return all levels if page and limit are not provided
            levels = await Level.findAll({
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
          throw new Error(`Failed to get all levels: ${error.message}`);
        }
      }
    
    

    async updateLevel(updateLevelDto: UpdateLevelDto, req: any) {
        try {
            const [updated] = await Level.update({
                level: updateLevelDto.level,
                description: updateLevelDto.description
            }, {
                where: {
                    level: {
                        [Op.eq]: updateLevelDto.level
                    }
                }
            });

            if (updated === 0) {
                throw new Error(`Level with id ${updateLevelDto.level} not found`);
            }

            return {
                statusCode: 200,
                message: "Successfully updated level"
            };
        } catch (error) {
            this.logger.error(`Failed to update level: ${error.message}`, error.stack);
            throw new Error(`Failed to update level: ${error.message}`);
        }
    }

    async createLevel(createLevelDto: CreateLevelDto, req: any) {
        try {
            await Level.create({
                level: createLevelDto.level,
                description: createLevelDto.description
            });

            return {
                statusCode: 200,
                message: "Successfully created new level"
            };
        } catch (error) {
            this.logger.error(`Failed to create new level: ${error.message}`, error.stack);
            throw new Error(`Failed to create new level: ${error.message}`);
        }
    }
}
