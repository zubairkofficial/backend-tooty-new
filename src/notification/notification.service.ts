import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Notification } from './entity/notification.entity';
import { Op } from 'sequelize';
import { UpdateNotification } from './dto/notification.dto';


@Injectable()
export class NotificationService {

    async updateNotificationIsRead(updateNotification: UpdateNotification) {
        try {

            await Notification.update({
                isRead: true
            }, {
                where: {
                    id: {
                        [Op.eq]: updateNotification.id
                    }
                }
            })

            return {
                statusCode: 200,
                message: "Notifications marked read successfully",

            };
        } catch (error) {
            throw new HttpException(error.message || "Error marking notification read", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getStudentNotifications(req: any, page: number = 1, limit: number = 10) {
        try {
            const offset = (page - 1) * limit;

            const { rows: notifications, count: total } = await Notification.findAndCountAll({
                where: {
                    level_id: {
                        [Op.eq]: req.user.level_id
                    },
                    school_id: {
                        [Op.eq]: req.user.school_id
                    },
                    isRead: {
                        [Op.eq]: "false"
                    }
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });

            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Notifications fetched successfully",
                notifications,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            throw new HttpException(error.message || "Error fetching notifications from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTeacherNotifications(req: any, page: number = 1, limit: number = 10) {
        try {
            const offset = (page - 1) * limit;

            const { rows: notifications, count: total } = await Notification.findAndCountAll({
                where: {
                    level_id: {
                        [Op.eq]: req.user.level_id
                    },
                    school_id: {
                        [Op.eq]: null
                    },
                    isRead: {
                        [Op.eq]: "false"
                    }
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });

            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "Notifications fetched successfully",
                notifications,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            throw new HttpException(error.message || "Error fetching notifications from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}
