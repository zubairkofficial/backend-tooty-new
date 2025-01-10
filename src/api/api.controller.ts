import { Body, Controller, Get, Param, Post, Put, Req, UseGuards, UseInterceptors } from '@nestjs/common';

import { ApiService } from './api.service';
// import { Roles } from 'src/decorators/roles.decorator';
// import { Role } from 'src/utils/roles.enum';


import { GetVoiceModelDto, UpdateApiKeyDto } from './dto/update-api.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
// import { RolesGuard } from 'src/guards/roles.guard';

@ApiTags('API')  // Swagger group name
@Controller('api')
export class ApiController {
  constructor(private readonly apiServices: ApiService) {}

  @Post('get-voice-model')
  @Roles(Role.ADMIN, Role.TEACHER, Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get voice models based on request' })
  @ApiBody({ type: GetVoiceModelDto })
  @ApiResponse({ status: 200, description: 'Voice models fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getVoiceModels(@Body() getVoiceModelDto: GetVoiceModelDto, @Req() req: any) {
    return this.apiServices.getVoiceModel(getVoiceModelDto);
  }

  @Get('get-deepgram-models')
  @Roles(Role.ADMIN)
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
  @Roles(Role.USER, Role.ADMIN, Role.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get Deepgram API information' })
  @ApiResponse({ status: 200, description: 'Deepgram API fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDeepGramApi(@Req() req: any) {
    return this.apiServices.getDeepGramApi(req);
  }

  @Get('get-all-apis')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Fetch all API keys for admin' })
  @ApiResponse({ status: 200, description: 'API keys fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllApiKeys(@Req() req: any) {
    return this.apiServices.getAllApiKeys(req);
  }

  @Put('update')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update an API key' })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiResponse({ status: 200, description: 'API key updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateAPIkey(@Body() updateApiKeyDto: UpdateApiKeyDto, @Req() req: any) {
    return this.apiServices.updateApiKey(updateApiKeyDto, req);
  }
}
