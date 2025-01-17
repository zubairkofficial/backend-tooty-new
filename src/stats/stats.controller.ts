import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
    @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: Request) {
    // Pass the request object to the service
    return this.statsService.getStats(req);
  }
}