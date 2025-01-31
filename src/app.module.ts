import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/entities/user.entity';
import { Otp } from './user/entities/otp.entity';
import { RefreshToken } from './user/entities/refreshToken.entity';
import { BotModule } from './bot/bot.module';
import { ContextDataModule } from './context_data/contextData.module';
import { Bot } from './bot/entities/bot.entity';
import { Join_BotContextData } from './bot/entities/join_botContextData.entity';
import { ApiModule } from './api/api.module';
import { File } from './context_data/entities/file.entity';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entities/chat.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StudentProfile } from './profile/entities/student-profile.entity';
import { ProfileModule } from './profile/profile.module';
import { SubjectModule } from './subject/subject.module';
import { LevelModule } from './level/level.module';
import { TeacherProfile } from './profile/entities/teacher-profile.entity';
import { Level } from './level/entity/level.entity';
import { Subject } from './subject/entity/subject.entity';
import { JoinTeacherSubjectLevel } from './profile/entities/join-teacher-subject-level.entity';
import { AdminProfile } from './profile/entities/admin-profile.entity';
import { ErrorLoggerMiddleware } from './middlewares/errorLogs.middleware';
import { QuizModule } from './quiz/quiz.module';
import { QuizAttemptModule } from './quiz-attempt/quiz-attempt.module';
import { QuestionModule } from './question/question.module';
import { OptionModule } from './option/option.module';
import { AnswerModule } from './answer/answer.module';
import { Quiz } from './quiz/entities/quiz.entity';
import { QuizAttempt } from './quiz-attempt/entities/quiz-attempt.entity';
import { Question } from './question/entities/question.entity';
import { Option } from './option/entities/option.entity';
import { Answer } from './answer/entities/answer.entity';
import { SchoolModule } from './school/school.module';
import { School } from './school/entities/school.entity';
import { SuperAdminProfile } from './profile/entities/super-admin.entity';
import { ParentProfile } from './profile/entities/parent-profile.entity';
import { StatsModule } from './stats/stats.module';
import { JoinSchoolAdmin } from './school/entities/join-school-admin.entity';
import { DistrictModule } from './district/district.module';
import { District } from './district/entity/district.entity';
import { SuperIntendentProfile } from './profile/entities/super-intendent-profile.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'images'), // Path to your images directory
      serveRoot: '/images', // URL prefix for accessing images
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadModels: true,
      models: [User, Otp, RefreshToken, Bot, Join_BotContextData, File, Chat, StudentProfile, TeacherProfile, ParentProfile ,AdminProfile, SuperAdminProfile, JoinTeacherSubjectLevel, Level, Subject, Quiz, QuizAttempt, Question, Option, Answer, School, JoinSchoolAdmin, District, SuperIntendentProfile],
      synchronize: process.env.DB_SYNCHRONIZE == 'true' ? true : false,
      logging: true,

      sync: {
        force: process.env.NODE_ENV == 'development' ? false : false,
        alter: process.env.NODE_ENV == 'development' ? true : false,
      },
      retryDelay: 3000,
    }),

    UserModule,

    BotModule,

    ContextDataModule,

    ApiModule,

    ChatModule,

    ProfileModule,

    SubjectModule,

    LevelModule,

    QuizModule,
    QuizAttemptModule,
    QuestionModule,
    OptionModule,
    AnswerModule,
    SchoolModule,
    StatsModule,
    DistrictModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorLoggerMiddleware).forRoutes('*'); // Apply middleware to all routes
  }
}