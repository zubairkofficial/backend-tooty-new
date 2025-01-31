// src/school/school.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { School } from './entities/school.entity';
import { SchoolsController } from './school.controller';
import { SchoolsService } from './school.service';
import { JwtService } from '@nestjs/jwt';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { File } from 'src/context_data/entities/file.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
import { User } from 'src/user/entities/user.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';
import { JoinSchoolAdmin } from './entities/join-school-admin.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([School, AdminProfile, Bot, File, Subject, Level, User, Chat, TeacherProfile, StudentProfile, ParentProfile, JoinSchoolAdmin]), // Register School model
    // forwardRef(() => UserModule), // Use forwardRef to resolve circular dependency
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService, JwtService],

})
export class SchoolModule { }