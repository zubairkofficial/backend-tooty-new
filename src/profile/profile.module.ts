import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StudentProfile } from './entities/student-profile.entity';
import { ConfigModule } from '@nestjs/config';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtService } from '@nestjs/jwt';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { JoinTeacherSubjectLevel } from './entities/join-teacher-subject-level.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { SuperAdminProfile } from './entities/super-admin.entity';
import { School } from 'src/school/entities/school.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { User } from 'src/user/entities/user.entity';
import { ParentProfile } from './entities/parent-profile.entity';
import { JoinSchoolAdmin } from 'src/school/entities/join-school-admin.entity';
import { SuperIntendentProfile } from './entities/super-intendent-profile.entity';
import { District } from 'src/district/entity/district.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { PuzzleAttempt } from 'src/puzzle/entity/puzzle-attempts.entity';
import { PuzzleAssignment } from 'src/puzzle/entity/puzzle-assignment.entity';

@Module({
    imports: [SequelizeModule.forFeature([SuperAdminProfile, StudentProfile, TeacherProfile, AdminProfile, JoinTeacherSubjectLevel, School, Subject, User, ParentProfile, JoinSchoolAdmin, SuperIntendentProfile, District, Bot, PuzzleAttempt, PuzzleAssignment]), ConfigModule],
    controllers: [ProfileController],
    providers: [ProfileService, JwtService]
})
export class ProfileModule { }
