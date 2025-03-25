import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Notification } from './entity/notification.entity';
import { Op } from 'sequelize';


@Injectable()
export class NotificationService {
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
                    }
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']], 
            });
    const newNotifcation = notifications
            
            await Promise.all(
                notifications.map((notification) => {
                    if (!notification.isRead) {
                        notification.isRead = true;  
                        return notification.save();  
                    }
                    return Promise.resolve(); 
                })
            );
    
            const totalPages = Math.ceil(total / limit);
    
            return {
                statusCode: 200,
                message: "Notifications fetched successfully",
                notifications: newNotifcation,
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
                    }
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']], 
            });
            const newNotifcation = notifications
    
            await Promise.all(
                notifications.map((notification) => {
                    if (!notification.isRead) {
                        notification.isRead = true; 
                        return notification.save(); 
                    }
                    return Promise.resolve(); 
                })
            );
    
            const totalPages = Math.ceil(total / limit);
    
            return {
                statusCode: 200,
                message: "Notifications fetched successfully",
                notifications: newNotifcation, 
                total,
                page,
                totalPages,
            };
        } catch (error) {
            throw new HttpException(error.message || "Error fetching notifications from the database", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    

}
