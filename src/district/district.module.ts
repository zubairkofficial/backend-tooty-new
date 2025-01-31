import { Module } from '@nestjs/common';
import { DistrictController } from './district.controller';
import { DistrictService } from './district.service';
import { JwtService } from '@nestjs/jwt';
import { District } from './entity/district.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SequelizeModule.forFeature([District, SuperIntendentProfile]), ConfigModule],
  controllers: [DistrictController],
  providers: [DistrictService, JwtService]
})
export class DistrictModule { }
