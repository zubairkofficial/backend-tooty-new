import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';
import { CreateSVGdto } from './dto/svg.dto';
import { AssignmentService } from './assignment.service';

@Controller('assignment')
export class AssignmentController {

    constructor(private readonly assignmentService: AssignmentService) { }

    @Post("/save-whiteboard")
    @Roles(Role.SUPER_ADMIN, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createSvg(@Body() createSVGdto: CreateSVGdto) {
        return this.assignmentService.saveWhiteboard(createSVGdto);
    }
}
