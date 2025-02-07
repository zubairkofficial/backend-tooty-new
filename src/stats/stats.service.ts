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
        return this.getTeacherStats(req);
      } else if (role === Role.USER) {
        return this.getUserStats(req);
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

      return {
        principals,
        schools,
        teachers,
        students,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getAdminStats(schoolId: number) {
    try {
      const teachers = await this.teacherProfileModel.count({ where: { school_id: schoolId } });
      const students = await this.studentProfileModel.count({ where: { school_id: schoolId } });


      const student_levels = await StudentProfile.findAll({
        where: {
          school_id: {
            [Op.eq]: schoolId
          }
        },
        include: [
          {
            required: true,
            model: Level,

          }
        ]

      })

      const teacher_levels = await TeacherProfile.findAll({
        where: {
          school_id: {
            [Op.eq]: schoolId
          }
        },
        include: [
          {
            required: true,
            model: Level,

          }
        ]

      })

      // Merge and get unique level_ids
      const uniqueLevels = new Set([
        ...teacher_levels.map(t => t.level_id),
        ...student_levels.map(s => s.level_id)
      ]);


      const students_subjects = await Subject.count({

        include: [
          {
            model: Level,
            include: [
              {
                model: StudentProfile,
                where: {
                  school_id: {
                    [Op.eq]: schoolId
                  }
                },
              }
            ]

          },
        ],
        distinct: true
      })

      const teachers_subjects = await Subject.count({

        include: [
          {
            model: TeacherProfile,
            where: {
              school_id: {
                [Op.eq]: schoolId
              }
            },
          }],
        distinct: true
      })

      const bots = await Subject.count({
        include: [
          {
            model: Level,
            include: [
              {
                model: StudentProfile,
                where: {
                  school_id: {
                    [Op.eq]: schoolId
                  }
                },
              }
            ]

          },
          {
            required: true,
            model: Bot,
          }],
        distinct: true
      })

      const quizzes = await Quiz.count({
        include: [
          {
            required: true,
            model: TeacherProfile,
            attributes: ['id', "school_id"],  // Only count unique subject IDs
            where: {
              school_id: {
                [Op.eq]: schoolId
              }
            },

          },
        ],
        distinct: true
      })

      return {
        teachers,
        students,
        bots,
        levels: uniqueLevels.size,
        students_subjects,
        teachers_subjects,
        quizzes,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getTeacherStats(req: any) {
    try {


      const students = await this.studentProfileModel.count({
        where: {
          level_id: {
            [Op.eq]: req.user.level_id
          },
          school_id: {
            [Op.eq]: req.user.school_id
          }
        }
      });

      const quizzes = await this.quizModel.count({
        where: {
          teacher_id: {
            [Op.eq]: req.user.sub
          }
        }
      });
      const subjects = await Subject.count({
        include: [{
          model: TeacherProfile,
          where: {
            id: {
              [Op.eq]: req.user.sub
            }
          }
        }]
      })

      return {
        students,
        quizzes,
        subjects
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  private async getUserStats(req: any) {
    try {


      const subjects = await Subject.count({
        where: {
          level_id: {
            [Op.eq]: req.user.level_id
          }
        }
      })
      // Total quizzes for the student's school and level
      const totalQuizzes = await this.quizModel.count({
        include: [
          {
            model: TeacherProfile,
            where: {
              school_id: {
                [Op.eq]: req.user.school_id
              }
            }
          },
        ],
        where: {
          level_id: {
            [Op.eq]: req.user.level_id
          }
        },
        distinct: true
      });

      // Quizzes attempted by the student
      const completedQuizzes = await this.quizAttemptModel.count({
        where: {
          student_id: {
            [Op.eq]: req.user.sub
          },
          submitted: {
            [Op.eq]: true
          }
        },
      });

      // Pending quizzes = total quizzes - completed quizzes
      const pendingQuizzes = totalQuizzes - completedQuizzes;

      return {
        totalQuizzes,
        completedQuizzes,
        pendingQuizzes,
        subjects
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}