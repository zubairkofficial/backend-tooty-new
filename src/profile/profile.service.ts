import { UpdateStudentProfileDto, UpdateSuperIntendentProfileDto, UpdateTeacherProfileDto } from './dto/update-profile.dto';
import { StudentProfile } from './entities/student-profile.entity';
import { GetStudentProfileDto } from './dto/get-profile.dto';
import { Op } from 'sequelize';
import { CreateJoinTeacherSubjectLevel, DeleteJoinTeacherSubjectLevel, GetJoinsTeacherSubjectLevelDto, GetTeacherProfileDto } from './dto/teacher-profile.dto';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { JoinTeacherSubjectLevel } from './entities/join-teacher-subject-level.entity';
import { AssignSchoolToAdminDto, UpdateAdminProfileDto, UpdateSuperAdminDto } from './dto/admin.dto';
import { AdminProfile } from './entities/admin-profile.entity';
import { SuperAdminProfile } from './entities/super-admin.entity';
import { User } from 'src/user/entities/user.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Role } from 'src/utils/roles.enum';
import { School } from 'src/school/entities/school.entity';
import { ParentProfile } from './entities/parent-profile.entity';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { Level } from 'src/level/entity/level.entity';
import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { Question } from 'src/question/entities/question.entity';
import { Option } from 'src/option/entities/option.entity';
import * as nodemailer from 'nodemailer'
import { Transaction } from 'sequelize';
import { SuperIntendentProfile } from './entities/super-intendent-profile.entity';
import { Sequelize } from 'sequelize-typescript';
import { JoinSchoolAdmin } from 'src/school/entities/join-school-admin.entity';
import { PuzzleAttempt } from 'src/puzzle/entity/puzzle-attempts.entity';
import { PuzzleAssignment } from 'src/puzzle/entity/puzzle-assignment.entity';
import { Puzzle } from 'src/puzzle/entity/puzzle.entity';

@Injectable()
export class ProfileService {

    constructor(

        private readonly sequelize: Sequelize

    ) { }


    async getSuperAdminProfile(req: any) {
        try {
            const super_admin_profile = await SuperAdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub,
                    },
                },
            });

            if (!super_admin_profile) {
                throw new HttpException(
                    'Super Admin profile not found',
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                statusCode: 200,
                data: super_admin_profile,
            };
        } catch (error) {
            console.error('Error in getSuperAdminProfile:', error);
            throw new HttpException(
                error.message || 'Failed to fetch Super Admin profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateSuperAdmin(updateAdminProfileDto: UpdateSuperAdminDto, req: any) {
        console.log('admin dto', updateAdminProfileDto, req.user.sub);
        try {
            const super_admin_profile_exist = await SuperAdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub,
                    },
                },
            });

            if (!super_admin_profile_exist) {
                await SuperAdminProfile.create({
                    openai: updateAdminProfileDto.openai,
                    dalle: updateAdminProfileDto.dalle,
                    deepgram: updateAdminProfileDto.deepgram,
                    master_prompt: updateAdminProfileDto.master_prompt,
                    user_id: req.user.sub,
                    id: req.user.sub,
                });
            } else {
                await SuperAdminProfile.update(
                    {
                        openai: updateAdminProfileDto.openai,
                        dalle: updateAdminProfileDto.dalle,
                        deepgram: updateAdminProfileDto.deepgram,
                        master_prompt: updateAdminProfileDto.master_prompt,
                    },
                    {
                        where: {
                            user_id: {
                                [Op.eq]: req.user.sub,
                            },
                        }
                    }
                );
            }

            return {
                statusCode: 200,
                message: 'Super Admin updated successfully',
            };
        } catch (error) {
            console.error('Error in updateSuperAdmin:', error);
            throw new HttpException(
                error.message || 'Failed to update Super Admin profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async assignSchoolToAdmin(assignSchoolToAdminDto: AssignSchoolToAdminDto) {
        const transaction = await this.sequelize.transaction(); // Start Transaction
        try {

            const join_school_admin = await JoinSchoolAdmin.findOne({
                where: {
                    admin_id: {
                        [Op.eq]: assignSchoolToAdminDto.admin_id
                    }
                },
                transaction
            })

            if (!join_school_admin) {
                await JoinSchoolAdmin.create({
                    admin_id: assignSchoolToAdminDto.admin_id,
                    school_id: assignSchoolToAdminDto.school_id
                }, {
                    transaction
                })

            } else {
                join_school_admin.school_id = assignSchoolToAdminDto.school_id
                await join_school_admin.save({ transaction })
            }
            await transaction.commit()

            return {
                statusCode: 200,
                message: "School Assignment updated successfully"
            }

        } catch (error) {
            await transaction.rollback()
            throw new HttpException(
                error.message || 'Failed to update admin school',
                HttpStatus.INTERNAL_SERVER_ERROR
            );

        }
    }


    async updateAdmin(updateAdminProfileDto: UpdateAdminProfileDto, req: any) {
        console.log('admin dto', updateAdminProfileDto);
        try {
            // Fetch the user from the database
            const user = await User.findOne({
                where: {
                    id: {
                        [Op.eq]: updateAdminProfileDto.admin_id,
                    },
                },
            });

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            // Check for email conflict
            const user_exist_email = await User.findOne({
                where: {
                    email: {
                        [Op.eq]: updateAdminProfileDto.email,
                    },
                },
            });

            if (user_exist_email && user_exist_email.id !== user.id) {
                throw new HttpException(
                    'Email already in use by another user',
                    HttpStatus.CONFLICT
                );
            }

            // Update user fields
            user.name = updateAdminProfileDto.name;
            user.contact = updateAdminProfileDto.contact;
            user.email = updateAdminProfileDto.email;

            await user.save();

            // Fetch and update the admin profile
            const admin_profile = await AdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: updateAdminProfileDto.admin_id,
                    },
                },
            });

            if (!admin_profile) {
                throw new HttpException(
                    'Admin profile not found',
                    HttpStatus.NOT_FOUND
                );
            }

            await admin_profile.update({
                school_id: updateAdminProfileDto.school_id,
            });

            return {
                statusCode: 200,
                message: 'Admin updated successfully',
            };
        } catch (error) {
            console.error('Error in updateAdmin:', error);
            throw new HttpException(
                error.message || 'Failed to update admin',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }



    async getParentByID(parentId: number, req: any) {
        try {
            const parent = await User.findOne({
                attributes: {
                    exclude: ['password'],
                },
                include: [
                    {
                        model: ParentProfile,
                        include: [
                            {
                                model: StudentProfile,
                                include: [
                                    {
                                        model: User,
                                        attributes: {
                                            exclude: ['password'],
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
                where: {
                    id: {
                        [Op.eq]: parentId,
                    },
                    role: {
                        [Op.eq]: Role.PARENT,
                    },
                },
            });

            if (!parent) {
                throw new HttpException(
                    'Parent profile not found',
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                statusCode: 200,
                data: parent,
            };
        } catch (error) {
            console.error('Error in getParentByID:', error);
            throw new HttpException(
                error.message || 'Failed to fetch parent profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    async getAllParents(req: any) {
        try {
            const parents = await User.findAll({
                attributes: {
                    exclude: ['password'],
                },
                include: [
                    {
                        model: ParentProfile,
                    },
                ],
                where: {
                    role: {
                        [Op.eq]: Role.PARENT,
                    },
                    school_id: {
                        [Op.eq]: req.user.school_id,
                    },
                },
            });

            if (!parents || parents.length === 0) {
                throw new HttpException('No parents found', HttpStatus.NOT_FOUND);
            }

            return {
                statusCode: 200,
                data: parents,
            };
        } catch (error) {
            console.error('Error in getAllParents:', error);
            throw new HttpException(
                error.message || 'Failed to fetch parent profiles',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllSuperIntendents(req: any) {
        try {
            const admins = await User.findAll({
                attributes: ["id", "name", "email", "contact", "role", "isVerified"],
                // include: [
                //     {
                //         model: AdminProfile,
                //     },
                // ],
                where: {
                    role: {
                        [Op.eq]: Role.SUPER_INTENDENT,
                    },
                },
            });



            return {
                statusCode: 200,
                data: admins,
            };
        } catch (error) {
            console.error('Error in getAllAdmins:', error);
            throw new HttpException(
                error.message || 'Failed to fetch admin profiles',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllAdmins(req: any) {
        try {
            const admins = await User.findAll({
                attributes: ["id", "name", "email", "contact", "role", "isVerified"],
                include: [
                    {
                        required: true,
                        model: AdminProfile,
                        attributes: ["district_id", "id"],
                        where: {
                            district_id: {
                                [Op.eq]: req.user.district_id
                            }
                        }
                    },
                ],
                where: {
                    role: {
                        [Op.eq]: Role.ADMIN,
                    },
                },
            });



            return {
                statusCode: 200,
                data: admins,
            };
        } catch (error) {
            console.error('Error in getAllAdmins:', error);
            throw new HttpException(
                error.message || 'Failed to fetch admin profiles',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAdminProfile(admin_id: string, req: any) {
        try {
            const admin_profile = await User.findOne({
                attributes: ["name", "email", "contact"],
                // include: [
                //     {
                //         model: AdminProfile,
                //         where: {
                //             id: {
                //                 [Op.eq]: Number(admin_id),
                //             },
                //         },
                //         include: [
                //             {
                //                 model: School,
                //             },
                //         ],
                //     },
                // ],
            });

            if (!admin_profile) {
                throw new HttpException('Admin profile not found', HttpStatus.NOT_FOUND);
            }

            return {
                statusCode: 200,
                data: admin_profile,
            };
        } catch (error) {
            console.error('Error in getAdminProfile:', error);
            throw new HttpException(
                error.message || 'Failed to fetch admin profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    async deleteJoinTeacherSubjectLevel(deleteJoinTeacherSubjectLevelDto: DeleteJoinTeacherSubjectLevel, req: any) {
        try {
            const deletedCount = await JoinTeacherSubjectLevel.destroy({
                where: {
                    level_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.level_id,
                    },
                    subject_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.subject_id,
                    },
                    teacher_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.teacher_id,
                    },
                },
            });

            if (deletedCount === 0) {
                throw new HttpException(
                    'No matching teacher-subject-level join found to delete',
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                statusCode: 200,
                message: 'Teacher-subject-level join deleted successfully',
            };
        } catch (error) {
            console.error('Error in deleteJoinTeacherSubjectLevel:', error);
            throw new HttpException(
                error.message || 'Failed to delete teacher-subject-level join',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }



    async getJoinTeacherSubjectLevel(getJoinTeacherSubjectLevelDto: GetJoinsTeacherSubjectLevelDto, req: any) {
        try {
            const teacher_data = await TeacherProfile.findOne({
                include: [
                    {
                        model: Subject,
                    },
                ],
                where: {
                    user_id: {
                        [Op.eq]: getJoinTeacherSubjectLevelDto.user_id,
                    },
                },
            });

            if (!teacher_data) {
                throw new HttpException(
                    'Teacher profile not found for the given user ID',
                    HttpStatus.NOT_FOUND
                );
            }

            // Optionally include additional related data from JoinTeacherSubjectLevel
            const additionalData = await JoinTeacherSubjectLevel.findAll({
                where: {
                    teacher_id: {
                        [Op.eq]: teacher_data.id,
                    },
                },
            });

            return {
                statusCode: 200,
                data: {
                    teacher_data,
                    additionalData,
                },
            };
        } catch (error) {
            console.error('Error in getJoinTeacherSubjectLevel:', error);
            throw new HttpException(
                error.message || 'Failed to fetch teacher-subject-level join',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async createJoinTeacherSubjectLevel(createJoinTeacherSubjectLevelDto: CreateJoinTeacherSubjectLevel, req: any) {
        try {
            console.log('Input DTO:', createJoinTeacherSubjectLevelDto);
            const user = await User.findByPk(createJoinTeacherSubjectLevelDto.teacher_id, {
                attributes: ["email"]
            })

            const createPromises = createJoinTeacherSubjectLevelDto.subject_id.map(async (id) => {
                const existingJoin = await JoinTeacherSubjectLevel.findOne({
                    where: {
                        level_id: createJoinTeacherSubjectLevelDto.level_id,
                        subject_id: Number(id),
                        teacher_id: createJoinTeacherSubjectLevelDto.teacher_id,
                    },
                });

                if (!existingJoin) {
                    return JoinTeacherSubjectLevel.create({
                        level_id: createJoinTeacherSubjectLevelDto.level_id,
                        subject_id: Number(id),
                        teacher_id: createJoinTeacherSubjectLevelDto.teacher_id,
                    });
                } else {
                    console.log(`Join already exists: Level ${createJoinTeacherSubjectLevelDto.level_id}, Subject ${id}, Teacher ${createJoinTeacherSubjectLevelDto.teacher_id}`);
                }
            });

            await Promise.all(createPromises);

            const transporter = nodemailer.createTransport({
                host: `${process.env.EMAIL_HOST}`,
                port: Number(`${process.env.EMAIL_PORT}`),
                secure: false,
                auth: {
                    user: `${process.env.EMAIL_USERNAME}`,
                    pass: `${process.env.EMAIL_PASSWORD}`,
                },
            });

            try {
                // Send email
                await transporter.sendMail({
                    from: `${process.env.EMAIL_FROM_ADDRESS}`,
                    to: user.email, // Use the provided email
                    subject: `Subject Assignment at Tooty for Teachers`,
                    text: `Congratulations!
                          You have been assigned new Subjects.

                          Log in to your account and see assigned Subjects in Subject section
            
                    `,
                    html: ` <p>Congratulations! You have been assigned new responsibilities
                            
                            </p>
                            <p>You have been assigned new Subjects. Log in to your account and see assigned Subjects in Subject section</p>
                            `,
                });

            } catch (error) {
                throw new Error("subject assignment email send failed")
            }

            return {
                statusCode: 200,
                message: "Teacher-level-subject joins created successfully.",
            };
        } catch (error) {
            console.error('Error in createJoinTeacherSubjectLevel:', error);
            throw new HttpException(
                error.message || "Error creating teacher-level-subject join",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getTeacherProfile(getTeacherProfile: GetTeacherProfileDto, req: any) {
        try {
            const profile = await User.findOne({
                attributes: [],
                include: [
                    {
                        model: TeacherProfile,
                        include: [
                            {
                                model: Subject,
                            },
                        ],
                    },
                ],
                where: {
                    id: getTeacherProfile.user_id,
                },
            });

            if (!profile) {
                throw new HttpException('Teacher profile not found', HttpStatus.NOT_FOUND);
            }

            console.log('Profile retrieved:', profile);

            return {
                statusCode: 200,
                data: profile,
            };
        } catch (error) {
            console.error('Error in getTeacherProfile:', error);
            throw new HttpException(error.message || "Error fetching teacher profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getStudentProfile(getProfileDto: GetStudentProfileDto, req: any) {
        try {
            const profile = await StudentProfile.findOne({
                where: {
                    user_id: getProfileDto.user_id,
                    school_id: req.user.school_id,
                },
            });

            if (!profile) {
                throw new HttpException('Student profile not found', HttpStatus.NOT_FOUND);
            }

            console.log('Profile retrieved:', profile);

            return {
                statusCode: 200,
                data: profile,
            };
        } catch (error) {
            console.error('Error in getStudentProfile:', error);
            throw new HttpException(error.message || "Error fetching student profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getChildren(req: any) {
        try {
            const children = await StudentProfile.findAll({
                where: {
                    parent_id: req.user.sub,
                },
                include: [
                    {
                        model: User,
                        as: 'user', // Ensure alias matches the relation in your model
                    },
                    {
                        model: School,
                        as: 'school',
                    },
                ],
            });

            if (!children || children.length === 0) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "No children found for the parent.",
                };
            }

            return {
                statusCode: HttpStatus.OK,
                data: children,
            };
        } catch (error) {
            console.error('Error in getChildren:', error);
            throw new HttpException(
                error.message || "Error fetching children data.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }



    async getStudentById(params: any, req: any) {
        try {
            console.log(`Fetching student profile for student_id: ${params.student_id}`);

            // Input validation
            if (!params.student_id || isNaN(params.student_id)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: "Invalid student ID provided.",
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const studentProfile = await StudentProfile.findOne({
                where: {
                    id: params.student_id,
                },
                include: [
                    {
                        model: School,
                        as: 'school',
                    },
                    {
                        model: Level,
                        as: 'level',
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: {
                            exclude: ["password"]
                        }
                    },

                ],
            });

            if (!studentProfile) {
                throw new Error("No Student Found")
            }

            return {
                statusCode: HttpStatus.OK,
                data: studentProfile,
            };
        } catch (error) {
            console.error('Error in getChildrenById:', error);
            throw new HttpException(
                error.message || "Error fetching student profile.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    async getChildrenPuzzleAttempts(params: any, req: any, page: number, limit: number) {
        try {
            console.log(`Fetching student profile for student_id: ${params.child_id}`);

            // Input validation
            if (!params.child_id || isNaN(params.child_id)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: "Invalid student ID provided.",
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Use findAndCountAll to get both the paginated data and the total count
            const { rows: data, count: total } = await PuzzleAttempt.findAndCountAll({
                where: {
                    student_id: {
                        [Op.eq]: params.child_id,
                    },
                    marked: true,
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: StudentProfile,
                        include: [
                            {
                                model: ParentProfile,
                                where: {
                                    id: {
                                        [Op.eq]: req.user.sub,
                                    },
                                },
                            },
                        ],
                        where: {
                            id: {
                                [Op.eq]: params.child_id,
                            },
                        },
                    },
                    {
                        model: PuzzleAssignment,
                        include: [
                            {
                                model: Puzzle,
                            },
                        ],
                    },
                ],
                limit,
                offset,
            });

            return {
                statusCode: HttpStatus.OK,
                data: {
                    data: data,
                    total,
                    page,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            console.error('Error in getChildrenPuzzleAttempts:', error);
            throw new HttpException(
                error.message || "Error fetching student profile.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getChildrenById(params: any, req: any) {
        try {
            console.log(`Fetching student profile for student_id: ${params.child_id}`);

            // Input validation
            if (!params.child_id || isNaN(params.child_id)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: "Invalid student ID provided.",
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Fetch the student profile and verify that the child belongs to the parent (req.user.sub)
            const studentProfile = await StudentProfile.findOne({
                where: {
                    id: params.child_id,
                },
                include: [
                    {
                        model: ParentProfile,
                        where: {
                            id: {
                                [Op.eq]: req.user.sub,
                            },
                        },
                    },
                    {
                        model: School,
                        as: 'school',
                    },
                    {
                        model: Level,
                        as: 'level',
                    },
                    {
                        model: User,
                        as: 'user',
                    },
                ],
            });

            if (!studentProfile) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `No student profile found for ID: ${params.child_id}`,
                };
            }

            console.log('Fetched student profile:', studentProfile);

            return {
                statusCode: HttpStatus.OK,
                data: studentProfile,
            };
        } catch (error) {
            console.error('Error in getChildrenById:', error);
            throw new HttpException(
                error.message || "Error fetching student profile.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getAttemptQuizes(params: any, req: any, page: number, limit: number) {
        try {
            // Validate child_id
            if (!params.child_id || isNaN(params.child_id)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: "Invalid student ID provided.",
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // First, ensure the student belongs to the parent calling this function.
            const studentProfile = await StudentProfile.findOne({
                where: {
                    id: params.child_id,
                },
                include: [
                    {
                        model: ParentProfile,
                        where: {
                            id: {
                                [Op.eq]: req.user.sub,
                            },
                        },
                    },
                ],
            });

            if (!studentProfile) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `No student profile found for ID: ${params.child_id} linked to this parent.`,
                };
            }

            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Fetch paginated quiz attempts for this student
            const { rows: quizAttempts, count } = await QuizAttempt.findAndCountAll({
                where: {
                    student_id: {
                        [Op.eq]: params.child_id,
                    },
                    marked: true,
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Quiz,
                        as: 'quiz',
                    },
                ],
                limit,
                offset,
            });

            return {
                statusCode: HttpStatus.OK,
                data: {
                    data: quizAttempts,
                    total: count,
                    page,
                    totalPages: Math.ceil(count / limit),
                },
            };
        } catch (error) {
            console.error('Error in getAttemptQuizes:', error);
            throw new HttpException(
                error.message || "Error fetching quiz attempts.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }



    async getStudentsByLevel(req: any) {
        try {
            const students = await StudentProfile.findAll({
                where: {
                    level_id: req.user.level_id,
                    school_id: req.user.school_id,
                },
            });

            if (!students || students.length === 0) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "No students found for the specified level and school.",
                };
            }

            return {
                statusCode: HttpStatus.OK,
                data: students,
            };
        } catch (error) {
            console.error('Error in getStudentsByLevel:', error);
            throw new HttpException(
                error.message || "Error fetching students by level.",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    async updateTeacherProfile(updateProfileDto: UpdateTeacherProfileDto, req: any, transaction: Transaction) {
        try {
            // Find the teacher profile instance
            const teacher = await TeacherProfile.findOne({
                where: { user_id: updateProfileDto.user_id },
                transaction
            });

            // Update the properties
            if (teacher) {
                teacher.title = updateProfileDto.title;
                teacher.level_id = updateProfileDto.level_id;

                // Save the instance to trigger the @BeforeUpdate hook
                await teacher.save({ transaction });

                return { statusCode: 200, message: "Teacher profile updated successfully" };
            } else {
                throw new HttpException('Teacher profile not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            console.error("Error updating teacher profile:", error);
            throw new HttpException(
                'An error occurred while updating the teacher profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateSuperIntendentProfile(updateProfileDto: UpdateSuperIntendentProfileDto, req: any, transaction: Transaction) {
        try {
            const [updatedRows] = await SuperIntendentProfile.update(
                {
                    district_id: updateProfileDto.district_id,
                },
                {
                    where: {
                        id: {
                            [Op.eq]: updateProfileDto.user_id
                        }
                    },
                    transaction
                }
            );

            if (updatedRows === 0) {
                throw new HttpException('No matching profile found to update', HttpStatus.NOT_FOUND);
            }

            return { statusCode: 200, message: "Super Intendent profile updated successfully" };
        } catch (error) {
            console.error("Error updating superintendent profile:", error);
            throw new HttpException(
                'An error occurred while updating the superintendent profile',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    async updateStudentProfile(updateProfileDto: UpdateStudentProfileDto, req: any, transaction: Transaction) {
        try {
            const [updatedCount] = await StudentProfile.update(
                {
                    level_id: updateProfileDto.level_id,
                    user_roll_no: updateProfileDto.user_roll_no,
                    parent_id: updateProfileDto.parent_id,
                },
                {
                    where: { user_id: updateProfileDto.user_id },
                    transaction
                }
            );

            if (updatedCount === 0) {
                throw new HttpException("Student profile not found or no changes made", HttpStatus.NOT_FOUND);
            }

            return { statusCode: 200, message: "Student profile updated successfully." };
        } catch (error) {
            console.error("Error updating student profile:", error);
            throw new HttpException(
                "An error occurred while updating the student profile",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateAdminProfile(updateProfileDto: UpdateAdminProfileDto, req: any, transaction: Transaction) {
        try {
            const [updatedRows] = await AdminProfile.update(
                {
                    school_id: updateProfileDto.school_id,
                },
                {
                    where: { user_id: req.user.id },
                    transaction
                }
            );

            if (updatedRows === 0) {
                throw new HttpException('No matching profile found to update', HttpStatus.NOT_FOUND);
            }

            return { statusCode: 200, message: "Admin profile updated successfully" };
        } catch (error) {
            console.error("Error updating admin profile:", error);
            throw new HttpException(
                "An error occurred while updating the admin profile",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }



}
