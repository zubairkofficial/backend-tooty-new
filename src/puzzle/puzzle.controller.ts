import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';
import { CreatePuzzleAssignmnet, CreatePuzzleDto, DeletePuzzleAssignmnet, DeletePuzzleDto, InitializeSubmitPuzzleDto, SubmitPuzzleDto, UpdatePuzzleDto } from './dto/puzzle.dto';
import { PuzzleService } from './puzzle.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerStorageConfig } from 'src/config/multer.config';

@Controller('puzzle')
export class PuzzleController {

    constructor(
        private readonly puzzleService: PuzzleService
    ) { }
    /////// teacher routes

    @Delete("/delete-puzzle-assignment")
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async deletePuzzleAssignment(@Body() deletePuzzleAssignmentDto: DeletePuzzleAssignmnet, @Req() req: any) {
        return this.puzzleService.deletePuzzleAssignment(deletePuzzleAssignmentDto, req)
    }

    @Post("/create-puzzle-assignment")
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createPuzzleAssignment(@Body() createPuzzleAssignment: CreatePuzzleAssignmnet, @Req() req: any) {
        return this.puzzleService.createPuzzleAssignment(createPuzzleAssignment, req)
    }

    @Get("/assigned-puzzle-by-id/:assigned_puzzle_id")
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getAssignedPuzzleByID(@Param('assigned_puzzle_id') assigned_puzzle_id: string) {
        return this.puzzleService.getAssignedPuzzleByID(Number(assigned_puzzle_id))
    }

    //teacher will get all created assigmnets
    @Get("/get-all-puzzle-assignments")
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getAllAssignedPuzzles(@Req() req: any) {
        return this.puzzleService.getAllAssignedPuzzles(req)
    }

    //get puzzles created by admin, bu level and subject


    @Get('/:subject_id/:student_id')
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getQuizAttemptsByStudentSubject(@Param() params: any, @Req() req: any, @Query('page') page?: number,
        @Query('limit') limit?: number) {
        return this.puzzleService.getPuzzleAttemptsByStudentSubject(params, req, page, limit);
    }

    @Get("/get-by-level-subject")
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getByLevelSubject(@Req() req: any, @Query('page') page?: number,
        @Query('limit') limit?: number) {
        return this.puzzleService.getByLevelSubject(req, page, limit)
    }
    /////
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

    //create puzzle by super admin
    @Post('/')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('image', multerStorageConfig))
    async create(@UploadedFile() image: Express.Multer.File, @Body() createPuzzleDto: CreatePuzzleDto) {
        return this.puzzleService.create(image, createPuzzleDto);
    }

    //delete puzzle by super admin
    @Delete('/')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async delete(@Body() deletePuzzleDto: DeletePuzzleDto) {
        return this.puzzleService.delete(deletePuzzleDto);
    }

    //get all puzzle by super admin
    @Get('/all')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.puzzleService.getAll(page, limit);
    }




    // get puzzle by level by student
    @Get('/get-by-level')
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getByLevel(@Req() req: any) {
        return this.puzzleService.getByLevel(req);
    }


    //get by id puzzle
    @Get('/:puzzle_id')
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getByID(@Param('puzzle_id') puzzle_id: string) {
        return this.puzzleService.getByID(puzzle_id);
    }

    //update puzzle by super admin
    @Patch("/")
    @Roles(Role.SUPER_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updatePuzzle(@Body() updatePuzzleDto: UpdatePuzzleDto) {
        return this.puzzleService.update(updatePuzzleDto);
    }
}
