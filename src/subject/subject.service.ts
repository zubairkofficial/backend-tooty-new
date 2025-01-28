import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { GetSubjectDto, UpdateSubjectDto, CreateSubjectDto, GetSubjectByLevelDto } from './dto/subject.dto';
import { Subject } from './entity/subject.entity';
import { Op } from 'sequelize';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { User } from 'src/user/entities/user.entity';
import { Level } from 'src/level/entity/level.entity';
import { School } from 'src/school/entities/school.entity';


export class SubjectService {
  async getSubjectsByTeacher(req: any) {
    try {

      const subjects = await User.findOne({
        include: [{
          model: TeacherProfile,
          include: [{
            model: Subject
          }]
        }],
        attributes: ["id"],
        where: {
          id: req.user.sub
        }
      })
      // const assignedSubjects = await JoinTeacherSubjectLevel.findAll({
      //   attributes: ['subject_id'],
      //   where: {
      //     teacher_id: {
      //       [Op.eq]: req.user.sub,
      //     },
      //   },
      // });

      // if (!assignedSubjects.length) {
      //   throw new HttpException(
      //     {
      //       errorCode: 2001,
      //       message: getErrorMessage(2001),
      //     },
      //     HttpStatus.NOT_FOUND,
      //   );
      // }

      // const subjectsByTeacher = await Subject.findAll({
      //   where: {
      //     id: {
      //       [Op.in]: assignedSubjects.map(({ subject_id }) => subject_id),
      //     },
      //   },
      // });

      return {
        statusCode: 200,
        data: subjects,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubjectsByLevel(getSubjectByLevelDto: GetSubjectByLevelDto, req: any) {
    try {
      const subjectsData = await Subject.findAll({
        where: {
          level_id: {
            [Op.eq]: getSubjectByLevelDto.level_id,

          },
          school_id: {
            [Op.eq]: req.user.school_id,

          },
        },
      });

      return {
        statusCode: 200,
        data: subjectsData,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubject(getSubjectDto: GetSubjectDto) {
    try {
      const subject = await Subject.findByPk(getSubjectDto.subject_id, {
        include: [{
          model: Level,
          as: "level"
        }]
      });

      if (!subject) {
        throw new HttpException(
          {
            errorCode: 2001,
            message: "Subject Not Found",
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        data: subject,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllSubjects({ page, limit }: { page?: number; limit?: number } = {}, req: any) {
    try {
      let subjects;
      let total;

      if (page && limit) {
        // Pagination logic
        const offset = (page - 1) * limit;
        const result = await Subject.findAndCountAll({
          where: {
            school_id: {
              [Op.eq]: req.user.school_id
            }
          },
          include: [{
            model: Level,
            as: "level"
          }],
          limit,
          offset,
        });
        subjects = result.rows; // Array of subjects
        total = result.count; // Total count of subjects
      } else {
        // Return all subjects if page and limit are not provided
        subjects = await Subject.findAll({
          where: {
            school_id: {
              [Op.eq]: req.user.school_id
            }
          },
          include: [{
            model: Level,
            as: "level"
          }],
        });
        total = subjects.length;
      }

      const totalPages = limit ? Math.ceil(total / limit) : 1;

      return {
        statusCode: 200,
        data: subjects,
        total,
        page: page || 1,
        limit: limit || total,
        totalPages,
        message: 'Successfully retrieved subjects',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async updateSubject(updateSubjectDto: UpdateSubjectDto, req: any) {
    try {
      const subject = await Subject.findOne({
        where: {
          id: updateSubjectDto.id,
          school_id: req.user.school_id, // Ensure the subject belongs to the same school
        },
      });

      if (!subject) {
        throw new HttpException(
          {
            errorCode: 2002,
            message: 'Subject not found or does not belong to the current school.',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if the new title already exists for the same school and level
      if (updateSubjectDto.title) {
        const existingSubject = await Subject.findOne({
          where: {
            title: updateSubjectDto.title,
            level_id: updateSubjectDto.level_id,
            school_id: req.user.school_id,
            id: { [Op.ne]: updateSubjectDto.id }, // Exclude the current subject
          },
        });

        if (existingSubject) {
          throw new HttpException(
            {
              errorCode: 2003,
              message: 'Subject with this title already exists for the given school and level.',
            },
            HttpStatus.CONFLICT,
          );
        }
      }

      await Subject.update(
        {
          title: updateSubjectDto.title,
          display_title: updateSubjectDto.display_title,
          description: updateSubjectDto.description,
          level_id: updateSubjectDto.level_id,
        },
        {
          where: {
            id: updateSubjectDto.id,
            school_id: req.user.school_id, // Ensure the update is scoped to the same school
          },
        },
      );

      return {
        statusCode: 200,
        message: 'Subject updated successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async createSubject(createSubjectDto: CreateSubjectDto, req: any) {
    try {
      // Ensure unique constraint is respected
      const existingSubject = await Subject.findOne({
        where: {
          title: createSubjectDto.title,
          level_id: createSubjectDto.level_id,
          school_id: req.user.school_id,
        },
      });

      if (existingSubject) {
        throw new HttpException(
          {
            errorCode: 2001,
            message: 'Subject with this title already exists for the given school and level.',
          },
          HttpStatus.CONFLICT,
        );
      }

      await Subject.create({
        title: createSubjectDto.title,
        display_title: createSubjectDto.display_title,
        description: createSubjectDto.description,
        level_id: createSubjectDto.level_id,
        school_id: req.user.school_id,
      });

      return {
        statusCode: 200,
        message: 'Subject created successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
