import { Injectable } from '@nestjs/common';
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
  ) {}

  async getStats(req:any) {
    const role = req.user.role;

    if (role === Role.SUPER_ADMIN) {
      return this.getSuperAdminStats();
    } else if (role === Role.ADMIN) {
      return this.getAdminStats(req.user.school_id);
    } else if (role === Role.TEACHER) {
      return this.getTeacherStats(req.user.sub);
    } else if (role === Role.USER) {
      return this.getUserStats(req.user.sub);
    } else {
      throw new Error('Unauthorized role');
    }
  }

  private async getSuperAdminStats() {
    const schools = await this.schoolModel.count();
    const teachers = await this.teacherProfileModel.count();
    const students = await this.studentProfileModel.count();
    const bots = await this.botModel.count();
    const levels = await this.levelModel.count();
    const subjects = await this.subjectModel.count();
    const quizzes = await this.quizModel.count();

    return {
      schools,
      teachers,
      students,
      bots,
      levels,
      subjects,
      quizzes,
    };
  }

  private async getAdminStats(schoolId: number) {
    const teachers = await this.teacherProfileModel.count({ where: { school_id: schoolId } });
    const students = await this.studentProfileModel.count({ where: { school_id: schoolId } });
    const bots = await this.botModel.count({ where: { school_id: schoolId } });
    const levels = await this.levelModel.count({ where: { school_id: schoolId } });
    const subjects = await this.subjectModel.count({ where: { school_id: schoolId } });
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
      bots,
      levels,
      subjects,
      quizzes,
    };
  }

  private async getTeacherStats(teacherId: number) {
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
  let bots=0,quizzes=0
    const students = await this.studentProfileModel.count({ where: { level_id: levelId } });
   if(subjectId)  bots = await this.botModel.count({ where: { level_id: levelId, subject_id: subjectId } });
    if(subjectId) quizzes = await this.quizModel.count({ where: { level_id: levelId, subject_id: subjectId } });
  
    return {
      students,
      bots,
      quizzes,
    };
  }
  private async getUserStats(userId: number) {
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
    };
  }
}