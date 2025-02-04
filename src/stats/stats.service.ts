import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/user/entities/user.entity';
import { School } from 'src/school/entities/school.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { Level } from 'src/level/entity/level.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Role } from 'src/utils/roles.enum';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { District } from 'src/district/entity/district.entity';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { Op } from 'sequelize';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(School) private schoolModel: typeof School,
    @InjectModel(TeacherProfile) private teacherProfileModel: typeof TeacherProfile,
    @InjectModel(StudentProfile) private studentProfileModel: typeof StudentProfile,
    @InjectModel(Bot) private botModel: typeof Bot,
    @InjectModel(Level) private levelModel: typeof Level,
    @InjectModel(Subject) private subjectModel: typeof Subject,
    @InjectModel(Quiz) private quizModel: typeof Quiz,
    @InjectModel(QuizAttempt) private quizAttemptModel: typeof QuizAttempt,
  ) { }

  async getStats(req: any) {
    try {
      const role = req.user.role;

      if (role === Role.SUPER_ADMIN) {
        return this.getSuperAdminStats();
      } else if (role === Role.SUPER_INTENDENT) {
        return this.getSuperIntendentsStats(req)
      } else if (role === Role.ADMIN) {
        return this.getAdminStats(req.user.school_id);
      } else if (role === Role.TEACHER) {
        return this.getTeacherStats(req.user.sub);
      } else if (role === Role.USER) {
        return this.getUserStats(req.user.sub);
      } else {
        throw new Error('Unauthorized role');
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getSuperAdminStats() {
    try {
      // const schools = await this.schoolModel.count();
      // const teachers = await this.teacherProfileModel.count();
      // const students = await this.studentProfileModel.count();
      const districts = await District.count();
      const super_intendents = await SuperIntendentProfile.count()
      const bots = await this.botModel.count();
      const levels = await this.levelModel.count();
      const subjects = await this.subjectModel.count();
      // const quizzes = await this.quizModel.count();

      return {
        districts,
        super_intendents,
        bots,
        levels,
        subjects,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getSuperIntendentsStats(req: any) {
    try {
      // const schools = await this.schoolModel.count();
      // const teachers = await this.teacherProfileModel.count();
      // const students = await this.studentProfileModel.count();
      const principals = await AdminProfile.count({
        where: {
          district_id: {
            [Op.eq]: req.user.district_id
          }
        }
      })
      const schools = await School.count({
        where: {
          created_by_id: {
            [Op.eq]: req.user.sub
          }
        }
      })
      const teachers = await TeacherProfile.count({
        include: [{
          model: School,
          where: {
            created_by_id: {
              [Op.eq]: req.user.sub
            }
          }
        }]
      })

      const students = await StudentProfile.count({
        include: [{
          model: School,
          where: {
            created_by_id: {
              [Op.eq]: req.user.sub
            }
          }
        }]
      })

      const subjects = await TeacherProfile.count({
        include: [{
          model: School,
          where: {
            created_by_id: {
              [Op.eq]: req.user.sub
            }
          }
        },
        {
          model: Subject,
          attributes: ['id'],  // Only count unique subject IDs
        }],
        distinct: true
      })
      // const quizzes = await this.quizModel.count();
      const levels = await StudentProfile.count({
        include: [{
          model: School,
          where: {
            created_by_id: {
              [Op.eq]: req.user.sub
            }
          }
        },
        {
          model: Level,
          attributes: ['id'],  // Only count unique subject IDs
        }],
        distinct: true
      })
      return {
        principals,
        schools,
        teachers,
        subjects,
        bots: subjects,
        students,
        levels

      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getAdminStats(schoolId: number) {
    try {
      const teachers = await this.teacherProfileModel.count({ where: { school_id: schoolId } });
      const students = await this.studentProfileModel.count({ where: { school_id: schoolId } });

      const levels = await TeacherProfile.count({
        where: {
          school_id: {
            [Op.eq]: schoolId
          }
        },
        include: [
          {
            model: Level,
            attributes: ['id'],
          }],
        distinct: true
      })
      const subjects = await TeacherProfile.count({
        where: {
          school_id: {
            [Op.eq]: schoolId
          }
        },
        include: [
          {
            model: Subject,
            attributes: ['id'],  // Only count unique subject IDs
          }],
        distinct: true
      })
      const quizzes = await this.quizModel.count({
        include: [
          {
            model: this.subjectModel,
            where: { school_id: schoolId }, // Filter by school_id in the Subject model
          },
        ],
      });
      return {
        teachers,
        students,
        bots: subjects,
        levels,
        subjects,
        quizzes,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getTeacherStats(teacherId: number) {
    try {
      const teacherProfile = await this.teacherProfileModel.findOne({
        where: { user_id: teacherId },
        include: [{ model: this.subjectModel, through: { attributes: [] } }], // Include associated subjects
      });

      if (!teacherProfile) {
        throw new Error('Teacher profile not found');
      }

      const levelId = teacherProfile.level_id;

      // Get the first subject associated with the teacher (or use your own logic)
      const subjectId = teacherProfile.subjects?.[0]?.id;
      // if (!subjectId) {
      //   throw new Error('No subject found for the teacher');
      // }
      let quizzes = 0
      const students = await this.studentProfileModel.count({ where: { level_id: levelId } });

      if (subjectId) quizzes = await this.quizModel.count({ where: { level_id: levelId, subject_id: subjectId } });

      return {
        students,

        quizzes,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  private async getUserStats(userId: number) {
    try {
      // Find the student profile for the user
      const studentProfile = await this.studentProfileModel.findOne({
        where: { user_id: userId },
        include: [{ model: Level, include: [{ model: School }] }], // Include level and school
      });

      if (!studentProfile) {
        throw new Error('Student profile not found');
      }

      const levelId = studentProfile.level_id;
      const schoolId = studentProfile.school_id;

      const subjets = await Subject.count({
        where: {
          level_id: {
            [Op.eq]: levelId
          }
        }
      })
      // Total quizzes for the student's school and level
      const totalQuizzes = await this.quizModel.count({
        include: [
          {
            model: Subject

          },
        ],
        where: { level_id: levelId }, // Filter by level_id in the Quiz model
      });

      // Quizzes attempted by the student
      const completedQuizzes = await this.quizAttemptModel.count({
        where: { student_id: studentProfile.id },
      });

      // Pending quizzes = total quizzes - completed quizzes
      const pendingQuizzes = totalQuizzes - completedQuizzes;

      return {
        totalQuizzes,
        completedQuizzes,
        pendingQuizzes,
        subjets
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}