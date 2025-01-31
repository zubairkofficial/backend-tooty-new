import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiService } from './api.service';
import { GetVoiceModelDto } from './dto/update-api.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('API')
@Controller('api')
export class ApiController {
  constructor(private readonly apiServices: ApiService) { }

  @Post('get-voice-model')
  @Roles(Role.ADMIN, Role.TEACHER, Role.USER, Role.SUPER_ADMIN, Role.SUPER_INTENDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get voice models based on request' })
  @ApiBody({ type: GetVoiceModelDto })
  @ApiResponse({ status: 200, description: 'Voice models fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getVoiceModels(@Body() getVoiceModelDto: GetVoiceModelDto, @Req() req: any) {
    return this.apiServices.getVoiceModel(getVoiceModelDto);
  }

  @Get('get-deepgram-models')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOperation({ summary: 'Fetch all Deepgram models for admin' })
  @ApiResponse({ status: 200, description: 'Deepgram models fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDeepGramModels(@Req() req: any) {
    return this.apiServices.getDeepGramModels(req);
  }

  @Get('get-deepgram-api')
  @Roles(Role.USER, Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN, Role.SUPER_INTENDENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Deepgram API information' })
  @ApiResponse({ status: 200, description: 'Deepgram API fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDeepGramApi(@Req() req: any) {
    return this.apiServices.getDeepGramApi(req);
  }




}
