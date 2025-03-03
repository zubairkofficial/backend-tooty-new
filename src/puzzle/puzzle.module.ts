import { Module } from '@nestjs/common';
import { PuzzleController } from './puzzle.controller';
import { PuzzleService } from './puzzle.service';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { PuzzleAttempt } from './entity/puzzle-attempts.entity';
import { Puzzle } from './entity/puzzle.entity';
import { Level } from 'src/level/entity/level.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SequelizeModule.forFeature([Subject, Level, Puzzle, PuzzleAttempt, StudentProfile]), ConfigModule],
  controllers: [PuzzleController],
  providers: [PuzzleService, JwtService]
})
export class PuzzleModule { }
