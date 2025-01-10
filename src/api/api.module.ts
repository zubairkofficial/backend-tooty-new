import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';

@Module({
  imports: [SequelizeModule.forFeature([SuperAdminProfile]), ConfigModule],
  controllers: [ApiController],
  providers: [ApiService, JwtService]
})
export class ApiModule { }
