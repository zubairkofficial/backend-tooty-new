// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';

import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { RefreshToken } from './entities/refreshToken.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { School } from 'src/school/entities/school.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
@Module({
  imports: [SequelizeModule.forFeature([User, SuperAdminProfile, AdminProfile, TeacherProfile, StudentProfile, RefreshToken, Chat, School, ParentProfile, SuperIntendentProfile, JoinTeacherSubjectLevel]), ConfigModule],
  controllers: [UserController],
  providers: [UserService, JwtService],
})
export class UserModule {}
