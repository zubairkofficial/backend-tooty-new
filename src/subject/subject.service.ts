import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { GetSubjectDto, UpdateSubjectDto, CreateSubjectDto, GetSubjectByLevelDto } from './dto/subject.dto';
import { Subject } from './entity/subject.entity';
import { Op } from 'sequelize';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getErrorMessage } from 'src/utils/errors.utils';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { User } from 'src/user/entities/user.entity';


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
      throw this.handleError(error, 4001);
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
      throw this.handleError(error, 4002);
    }
  }

  async getSubject(getSubjectDto: GetSubjectDto) {
    try {
      const subject = await Subject.findByPk(getSubjectDto.subject_id);

      if (!subject) {
        throw new HttpException(
          {
            errorCode: 2001,
            message: getErrorMessage(2001),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        data: subject,
      };
    } catch (error) {
      throw this.handleError(error, 4003);
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
          limit,
          offset,
        });
        subjects = result.rows; // Array of subjects
        total = result.count; // Total count of subjects
      } else {
        // Return all subjects if page and limit are not provided
        subjects = await Subject.findAll();
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
      throw this.handleError(error, 4004);
    }
  }

  async updateSubject(updateSubjectDto: UpdateSubjectDto) {
    try {
      const [updated] = await Subject.update(
        {
          title: updateSubjectDto.title,
          display_title: updateSubjectDto.display_title,
          description: updateSubjectDto.description,
          level_id: updateSubjectDto.level_id,
        },
        {
          where: {
            id: {
              [Op.eq]: updateSubjectDto.id,
            },
          },
        },
      );

      if (!updated) {
        throw new HttpException(
          {
            errorCode: 2002,
            message: getErrorMessage(2002),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        message: 'Subject updated successfully',
      };
    } catch (error) {
      throw this.handleError(error, 4005);
    }
  }

  async createSubject(createSubjectDto: CreateSubjectDto, req: any) {
    try {
      await Subject.create({
        title: createSubjectDto.title,
        display_title: createSubjectDto.display_title,
        description: createSubjectDto.description,
        level_id: createSubjectDto.level_id,
        school_id: req.user.school_id
      });

      return {
        statusCode: 200,
        message: 'Subject created successfully',
      };
    } catch (error) {
      throw this.handleError(error, 4006);
    }
  }

  private handleError(error: any, errorCode: number): HttpException {
    const message = getErrorMessage(errorCode);

    console.error(`Error Code: ${errorCode}, Message: ${message}`, error);

    return new HttpException(
      {
        errorCode,
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
