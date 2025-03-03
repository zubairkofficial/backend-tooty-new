import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';
import { CreatePuzzleDto, DeletePuzzleDto, InitializeSubmitPuzzleDto, SubmitPuzzleDto, UpdatePuzzleDto } from './dto/puzzle.dto';
import { PuzzleService } from './puzzle.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerStorageConfig } from 'src/config/multer.config';

@Controller('puzzle')
export class PuzzleController {

    constructor(
        private readonly puzzleService: PuzzleService
    ) { }

    @Post('/initialize-submit-puzzle')
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createSubmitPuzzleAttempt(@Body() submitPuzzleDto: InitializeSubmitPuzzleDto, @Req() req: any) {
        return this.puzzleService.createSubmitPuzzle(submitPuzzleDto, req);
    }

    @Post('/submit-puzzle')
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('image', multerStorageConfig))
    async sumbitPuzzleAttempt(@UploadedFile() image: Express.Multer.File, @Body() submitPuzzleDto: SubmitPuzzleDto, @Req() req: any) {
        if (!image) {
            throw new Error("no image found")
        }
        return this.puzzleService.submitPuzzle(image, submitPuzzleDto, req);
    }

    @Post('/')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('image', multerStorageConfig))
    async create(@UploadedFile() image: Express.Multer.File, @Body() createPuzzleDto: CreatePuzzleDto) {
        return this.puzzleService.create(image, createPuzzleDto);
    }

    @Delete('/')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async delete(@Body() deletePuzzleDto: DeletePuzzleDto) {
        return this.puzzleService.delete(deletePuzzleDto);
    }

    @Get('/all')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.puzzleService.getAll(page, limit);
    }

    @Get('/get-by-level')
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getByLevel(@Req() req: any) {
        return this.puzzleService.getByLevel(req);
    }


    @Get('/:puzzle_id')
    @Roles(Role.USER, Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getByID(@Param('puzzle_id') puzzle_id: string) {
        return this.puzzleService.getByID(puzzle_id);
    }

    @Patch("/")
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updatePuzzle(@Body() updatePuzzleDto: UpdatePuzzleDto) {
        return this.puzzleService.update(updatePuzzleDto);
    }
}
