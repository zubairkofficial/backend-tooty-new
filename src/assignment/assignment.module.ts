import { Module } from '@nestjs/common';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AssignmentController],
  providers: [AssignmentService, JwtService]
})
export class AssignmentModule {}
