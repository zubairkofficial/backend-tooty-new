import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Level } from 'src/level/entity/level.entity';
import { School } from 'src/school/entities/school.entity';
import { Notification } from './entity/notification.entity';

@Module({
  imports: [SequelizeModule.forFeature([Level, School, Notification]), ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, JwtService]
})
export class NotificationModule { }
