import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwtVerifyAuth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/utils/roles.enum';
import { NotificationService } from './notification.service';
import { UpdateNotification } from './dto/notification.dto';

@Controller('notification')
export class NotificationController {
    constructor(private readonly notificationServices: NotificationService) { }


    @Post("/notification-read")
    @Roles(Role.USER, Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateIsRead(@Body() updateNotification: UpdateNotification){
        return this.notificationServices.updateNotificationIsRead(updateNotification)
    }

    @Get("/get-student-notifications")
    @Roles(Role.USER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getStudentNotifications(@Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.notificationServices.getStudentNotifications(req, page, limit)
    }

    @Get("/get-teacher-notifications")
    @Roles(Role.TEACHER)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getTeacherNotifications(@Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.notificationServices.getTeacherNotifications(req, page, limit)
    }

}
