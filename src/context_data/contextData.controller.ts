import { Body, Controller, Delete, Get, Post, Query, Req, Res, Sse, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContextDataService } from './contextData.service';
import { CreateFileDto, DeleteFileDto, GetFilesBySubjectDto } from './dto/create-contextData.dto';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/roles.enum';
import { RolesGuard } from 'src/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { multerTemporaryStorageConfig } from 'src/config/multer.config';

@ApiTags('Context Data') // Swagger group
@Controller('context-data')
@ApiBearerAuth('access-token')
export class ContextDataController {
  private progressSubject = new Subject<{ progress: number, message: any }>();

  constructor(private readonly contextDataService: ContextDataService) { }

  @Post('upload')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file', multerTemporaryStorageConfig))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data') // Indicates file upload
  @ApiResponse({ status: 200, description: 'File uploaded successfully. Processing started.' })
  @ApiResponse({ status: 400, description: 'No file uploaded.' })
  @ApiBody({
    description: 'File upload data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        file_name: {
          type: 'string',
        },
        slug: {
          type: 'string',
        },
        subject_id: {
          type: 'string',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (!file) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }
    res.send({ statusCode: 200, message: 'File uploaded successfully. Processing started.' });

    this.contextDataService.processFile(file, createFileDto, req, (progress: number) => {
      console.log("progress", progress)
      // Emit progress updates
     
      this.progressSubject.next({ progress, message: 'Processing' });

    }).catch((err) => {
      console.error('Error processing file:', err);
      this.progressSubject.next({ progress: 100, message: 'Error in processing' });
    });
  }


  @Sse('upload-progress')
  uploadProgress(@Req() req: any): Observable<{ data: { progress: number } }> {
    return new Observable((observer) => {
      const subscription = this.progressSubject.subscribe({
        next: ({ progress }) => {
          observer.next({ data: { progress } });
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      // Cleanup on disconnection
      return () => subscription.unsubscribe();
    });
  }

  @Delete('delete')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Error while deleting file.' })
  async deleteFile(@Body() deleteFileDto: DeleteFileDto, @Req() req: any) {
    return this.contextDataService.deleteFile(deleteFileDto, req);
  }

  @Get('files-by-user')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get files uploaded by a user' })
  @ApiResponse({ status: 200, description: 'List of files uploaded by the user.' })
  @ApiResponse({ status: 400, description: 'Error fetching files.' })
  async getFiles(
    @Req() req: any,
    @Query('page') page?: number, // Optional parameter
    @Query('limit') limit?: number, // Optional parameter
  ) {
    return this.contextDataService.getAllFilesByUser(req, page, limit);
  }

  @Post('files-by-subject')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get files by subject' })
  @ApiResponse({ status: 200, description: 'List of files by subject.' })
  @ApiResponse({ status: 400, description: 'Error fetching files by subject.' })
  @ApiBody({
    description: 'Subject for which files should be fetched.',
    type: GetFilesBySubjectDto,
  })
  async getFilesBySubject(@Body() getFileBySubjectDto: GetFilesBySubjectDto, @Req() req: any) {
    return this.contextDataService.getFilesBySubject(getFileBySubjectDto, req);
  }
}
