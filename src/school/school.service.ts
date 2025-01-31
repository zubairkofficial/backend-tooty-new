import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { School } from './entities/school.entity';
import { Op } from 'sequelize';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { User } from 'src/user/entities/user.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Sequelize } from 'sequelize-typescript';
import { Subject } from 'src/subject/entity/subject.entity';
import { File } from 'src/context_data/entities/file.entity';
import { Level } from 'src/level/entity/level.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    @InjectModel(School)

    private readonly sequelize: Sequelize
  ) { }

  // Create a new school
  async createSchool(createSchoolDto: CreateSchoolDto, req: any) {
    this.logger.log('Creating a new school');
    try {
      const school_exist = await School.findOne({
        where: {
          name: {
            [Op.eq]: createSchoolDto.name
          }
        }
      })
      if (school_exist) {
        throw new Error("School already exist with this name")
      }
      const school = await School.create({
        name: createSchoolDto.name,
        description: createSchoolDto.description,
        created_by_id: req.user.sub
      });
      this.logger.log(`School created successfully with ID ${school.id}`);
      return school;
    } catch (error) {
      this.logger.error('Failed to create school', error.stack);
      throw new HttpException(error.message || 'Failed to create school', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async getSchoolByAdmin(req: any) {


    try {
      const data = await School.findOne({
        include: [{
          model: AdminProfile,
          where: {
            id: req.user.sub
          }
        }],
      })

      return {
        statusCode: 200,
        data: data
      }

    } catch (error) {
      this.logger.error('Failed to fetch school', error.stack);
      throw new HttpException(error.message || 'Failed to fetch school', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // Get all schools with pagination
  async getAllSchools(page: number = 1, limit: number = 10, req: any) {
    this.logger.log('Fetching all schools');
    const offset = (page - 1) * limit;
    try {
      const { rows, count } = await School.findAndCountAll({
        offset,
        limit,
        where: {
          created_by_id: {
            [Op.eq]: req.user.sub
          }
        }

      });
      this.logger.log(`Fetched ${rows.length} schools successfully`);
      return { data: rows, total: count };
    } catch (error) {
      this.logger.error('Failed to fetch schools', error.stack);
      throw new HttpException(error.message || 'Failed to fetch schools', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get a school by ID
  async getSchoolById(id: number, req: any) {
    this.logger.log(`Fetching school with ID ${id}`);
    try {
      const school = await School.findOne({
        include: [
          {
            model: AdminProfile,
            include: [{
              model: User,
              attributes: ["name", "email", "contact", "role", "user_image_url"]
            }]

          }
        ],
        where: {
          id: {
            [Op.eq]: id
          },
          created_by_id: {
            [Op.eq]: req.user.sub
          }
        }
      });
      if (!school) {
        this.logger.warn(`School with ID ${id} not found`);
        throw new NotFoundException(`School with ID ${id} not found`);
      }
      this.logger.log(`School with ID ${id} fetched successfully`);
      return school;
    } catch (error) {
      this.logger.error(`Failed to fetch school with ID ${id}`, error.stack);
      throw new HttpException(error.message || `Failed to fetch school with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update a school by ID
  async updateSchool(id: number, updateSchoolDto: UpdateSchoolDto) {
    this.logger.log(`Updating school with ID ${id}`);
    try {
      const school = await School.findByPk(id)
      await school.update(updateSchoolDto); // Update school properties
      this.logger.log(`School with ID ${id} updated successfully`);
      return school;
    } catch (error) {
      this.logger.error(`Failed to update school with ID ${id}`, error.stack);
      throw new HttpException(error.message || 'Failed to update school', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete a school by ID (soft delete)
  // async deleteSchool(id: number): Promise<void> {
  //   this.logger.log(`Deleting school with ID ${id}`);
  //   // const transaction = await this.sequelize.transaction();
  //   try {
  //     const school = await this.getSchoolById(id); // Check if school exists

  //     //       const bots = await Bot.findAll({
  //     //         attributes: ["id"],
  //     //         where: {
  //     //           school_id: {
  //     //             [Op.eq]: id
  //     //           }
  //     //         }
  //     //       })

  //     //       await Chat.destroy({
  //     //         where: {
  //     //           bot_id: {
  //     //             [Op.in]: bots.map((bot) => bot.id)
  //     //           }
  //     //         },
  //     //         transaction
  //     //       })
  //     //         await Bot.destroy({
  //     //           where: {
  //     //             school_id: {
  //     //               [Op.eq]: id
  //     //             }
  //     //           },
  //     //           transaction
  //     //         })
  //     //  await File.destroy({
  //     //           where: {
  //     //             school_id: {
  //     //               [Op.eq]: id
  //     //             }
  //     //           },
  //     //           transaction
  //     //         })
  //     //         await Subject.destroy({
  //     //           where: {
  //     //             school_id: {
  //     //               [Op.eq]: id
  //     //             }
  //     //           },
  //     //           transaction
  //     //         })
  //     //         await Level.destroy({
  //     //           where: {
  //     //             school_id: {
  //     //               [Op.eq]: id
  //     //             }
  //     //           },
  //     //           transaction
  //     //         })

  //     //  await StudentProfile.destroy({
  //     //   where: {
  //     //     school_id: {
  //     //       [Op.eq]: id
  //     //     }
  //     //   },
  //     //   transaction
  //     //  })
  //     //  await TeacherProfile.destroy({
  //     //   where: {
  //     //     school_id: {
  //     //       [Op.eq]: id
  //     //     }
  //     //   },
  //     //   transaction
  //     //  })
  //     //  await User.destroy({
  //     //   where: {
  //     //     school_id: {
  //     //       [Op.eq]: id
  //     //     }
  //     //   },
  //     //   transaction
  //     //  })


  //     await school.destroy(); // Soft delete the school
  //     this.logger.log(`School with ID ${id} deleted successfully`);
  //   } catch (error) {
  //     this.logger.error(`Failed to delete school with ID ${id}`, error.stack);
  //     throw new Error('Failed to delete school: ' + error.message);
  //   }
  // }

  // Restore a soft-deleted school by ID
  async restoreSchool(id: number) {
    this.logger.log(`Restoring school with ID ${id}`);
    try {
      await School.restore({ where: { id } });
      this.logger.log(`School with ID ${id} restored successfully`);
    } catch (error) {
      this.logger.error(`Failed to restore school with ID ${id}`, error.stack);
      throw new HttpException(error.message || 'Failed to restore school', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}