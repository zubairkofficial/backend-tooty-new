import { UpdateStudentProfileDto } from './dto/update-profile.dto';
import { StudentProfile } from './entities/student-profile.entity';
import { GetStudentProfileDto } from './dto/get-profile.dto';
import { Op } from 'sequelize';
import { CreateJoinTeacherSubjectLevel, DeleteJoinTeacherSubjectLevel, GetJoinsTeacherSubjectLevelDto, GetTeacherProfileDto, UpdateTeacherProfileDto } from './dto/teacher-profile.dto';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { JoinTeacherSubjectLevel } from './entities/join-teacher-subject-level.entity';
import { UpdateAdminProfileDto, UpdateSuperAdminDto } from './dto/admin.dto';
import { AdminProfile } from './entities/admin-profile.entity';
import { SuperAdminProfile } from './entities/super-admin.entity';
import { User } from 'src/user/entities/user.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Role } from 'src/utils/roles.enum';
import { School } from 'src/school/entities/school.entity';
import { ParentProfile } from './entities/parent-profile.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { RefreshToken } from 'src/user/entities/refreshToken.entity';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { Level } from 'src/level/entity/level.entity';
import { HttpStatus, HttpException } from '@nestjs/common';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Answer } from 'src/answer/entities/answer.entity';


export class ProfileService {

    async getSuperAdminProfile(req: any) {
        try {
            const super_admin_profile = await SuperAdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                data: super_admin_profile

            }
        } catch (error) {
            throw new Error("failed to fetch super admin profile")
        }
    }

    async updateSuperAdmin(updateAdminProfileDto: UpdateSuperAdminDto, req: any) {
        console.log("admin dto", updateAdminProfileDto, req.user.sub)
        try {
            const super_admin_profile_exist = await SuperAdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })

            if (!super_admin_profile_exist) {
                await SuperAdminProfile.create({
                    openai: updateAdminProfileDto.openai,
                    dalle: updateAdminProfileDto.dalle,
                    deepgram: updateAdminProfileDto.deepgram,
                    master_prompt: updateAdminProfileDto.master_prompt,
                    user_id: req.user.sub,
                    id: req.user.sub
                })
            }
            await SuperAdminProfile.update({
                openai: updateAdminProfileDto.openai,
                dalle: updateAdminProfileDto.dalle,
                deepgram: updateAdminProfileDto.deepgram,
                master_prompt: updateAdminProfileDto.master_prompt
            }, {
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                message: "super admin updated successfully",

            }
        } catch (error) {
            console.log("error", error)
            throw new Error("failed to updateb super admin")
        }
    }


    async updateAdmin(updateAdminProfileDto: UpdateAdminProfileDto, req: any) {
        console.log("admin dto", updateAdminProfileDto)
        try {
            const admin_profile = await AdminProfile.findOne({
                where: {
                    user_id: {
                        [Op.eq]: updateAdminProfileDto.admin_id
                    }
                }
            })


            await admin_profile.update({
                school_id: updateAdminProfileDto.school_id
            })
            return {
                statusCode: 200,
                message: "super admin updated successfully",

            }
        } catch (error) {
            throw new Error("failed to updateb super admin")
        }
    }
    async getParentByID(parentId: number, req: any) {
        try {
            const parent = await User.findOne({
                attributes: {
                    exclude: ["password"]
                },
                include: [{
                    model: ParentProfile,
                    include: [{
                        model: StudentProfile,
                        include: [{
                            model: User,
                            attributes: {
                                exclude: ["password"]
                            }
                        }]
                    }]

                }],
                where: {
                    id: {
                        [Op.eq]: parentId
                    },
                    role: {
                        [Op.eq]: Role.PARENT
                    }
                }
            })
            return {
                statusCode: 200,
                data: parent

            }
        } catch (error) {
            throw new Error("failed to fetch parents profile")
        }
    }
    async getAllParents(req: any) {
        try {
            const parents = await User.findAll({
                attributes: {
                    exclude: ["password"]
                },
                include: [{
                    model: ParentProfile,

                }],
                where: {
                    role: {
                        [Op.eq]: Role.PARENT
                    },
                    school_id: {
                        [Op.eq]: req.user.school_id
                    }
                }
            })
            return {
                statusCode: 200,
                data: parents

            }
        } catch (error) {
            throw new Error("failed to fetch parents profile")
        }
    }
    async getAllAdmins(req: any) {
        try {
            const admins = await User.findAll({
                include: [{
                    model: AdminProfile,
                }],
                where: {
                    role: {
                        [Op.eq]: Role.ADMIN
                    }
                }
            })
            return {
                statusCode: 200,
                data: admins

            }
        } catch (error) {
            throw new Error("failed to fetch admin profile")
        }
    }

    async getAdminProfile(admin_id: string, req: any) {
        try {
            const admin_profile = await User.findOne({
                include: [{
                    model: AdminProfile,
                    where: {
                        id: {
                            [Op.eq]: Number(admin_id)
                        }
                    }, include: [
                        {
                            model: School,
                        },
                    ],
                },


                ]

            })
            return {
                statusCode: 200,
                data: admin_profile

            }
        } catch (error) {
            throw new Error("failed to fetch admin profile")
        }
    }



    //teacher management
    async deleteJoinTeacherSubjectLevel(deleteJoinTeacherSubjectLevelDto: DeleteJoinTeacherSubjectLevel, req: any) {
        try {
            await JoinTeacherSubjectLevel.destroy({
                where: {
                    level_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.level_id
                    },
                    subject_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.subject_id
                    },
                    teacher_id: {
                        [Op.eq]: deleteJoinTeacherSubjectLevelDto.teacher_id
                    },
                }
            })
            return {
                statusCode: 200,
                message: "teacher subject leve join deleted successfully",

            }
        } catch (error) {
            throw new Error("failed to delete teacher subject level join")
        }
    }

    async getJoinTeacherSubjectLevel(getJoinTeacherSubjectLevelDto: GetJoinsTeacherSubjectLevelDto, req: any) {
        try {

            const teacher_data = await TeacherProfile.findOne({
                include: [
                    {
                        model: Subject
                    }
                ],
                where: {
                    user_id: {
                        [Op.eq]: getJoinTeacherSubjectLevelDto.user_id
                    }
                }
            }).then(async (teacher) => {
                // const data = await JoinTeacherSubjectLevel.findAll({
                //     include:[{
                //         model
                //     }],
                //     where: {

                //         teacher_id: {
                //             [Op.eq]: teacher.id
                //         },
                //     }
                // })

                // return data

            })
            return {
                statusCode: 200,
                data: teacher_data
            }
        } catch (error) {
            console.log(error)
            throw new Error("failed to get teacher subject level join")
        }
    }

    async createJoinTeacherSubjectLevel(createJoinTeacherSubjectLevelDto: CreateJoinTeacherSubjectLevel, req: any) {
        try {
            console.log(createJoinTeacherSubjectLevelDto)
            for (const id of createJoinTeacherSubjectLevelDto.subject_id) {
                const joinAlreadyExist = await JoinTeacherSubjectLevel.findOne({
                    where: {
                        level_id: createJoinTeacherSubjectLevelDto.level_id,
                        subject_id: Number(id),
                        teacher_id: createJoinTeacherSubjectLevelDto.teacher_id,
                    },
                });

                if (!joinAlreadyExist) {
                    await JoinTeacherSubjectLevel.create({
                        level_id: createJoinTeacherSubjectLevelDto.level_id,
                        subject_id: Number(id),
                        teacher_id: createJoinTeacherSubjectLevelDto.teacher_id,
                    });
                } else {
                    console.log(`Join for level ${createJoinTeacherSubjectLevelDto.level_id}, subject ${id}, and teacher ${createJoinTeacherSubjectLevelDto.teacher_id} already exists.`);
                }
            }

            return {
                statusCode: 200,
                message: "Teacher-level-subject join created successfully.",
            };
        } catch (error) {
            throw new Error(error.message || "Error creating teacher-level-subject join");
        }
    }


    async getTeacherProfile(getTeacherProfile: GetTeacherProfileDto, req: any) {
        try {
            const get_profile = await User.findOne({
                attributes: [],
                include: [{
                    model: TeacherProfile,

                    include: [{
                        model: Subject
                    }]
                }],
                where: {
                    id: getTeacherProfile.user_id
                },

            });
            console.log("proflie ", get_profile)

            return {
                statusCode: 200,
                data: get_profile
            }

        } catch (error) {
            console.log(error)
            throw new Error(error.message)
        }
    }

    async updateTeacherProfile(updateTeacherProfile: UpdateTeacherProfileDto, req: any) {
        try {
            const update_profile = await TeacherProfile.update({
                title: updateTeacherProfile.title,
                level_id: updateTeacherProfile.level_id

            }, {
                where: {
                    user_id: {
                        [Op.eq]: updateTeacherProfile.user_id
                    }
                }
            });
            console.log("proflie updated", update_profile)

            return {
                statusCode: 200,
                message: "profile updated successfully",
                data: update_profile
            }

        } catch (error) {
            console.log(error)
            throw new Error('error updating profile')
        }
    }


    //student management
    async getStudentProfile(getProfileDto: GetStudentProfileDto, req: any) {
        try {
            const get_profile = await StudentProfile.findOne({
                where: {
                    user_id: getProfileDto.user_id,
                    school_id: req.user.school_id,
                }
            });
            console.log("proflie ", get_profile)

            return {
                statusCode: 200,
                data: get_profile
            }

        } catch (error) {
            console.log(error)
            throw new Error('error getting profile')
        }
    }

    async getChildren(req: any) {
        try {

            const data = await StudentProfile.findAll({

                where: {

                    parent_id: {
                        [Op.eq]: req.user.sub,
                    },
                },
                include: [
                    {
                        model: User, // Assuming a User model exists
                        as: 'user', // Alias for the relation
                    },
                    {
                        model: School, // Assuming a School model exists
                        as: 'school', // Alias for the relation
                    },
                ],
            });
            return {
                statusCode: 200,
                data: data
            }
        } catch (error) {
            throw new Error("Error getting students by level")
        }
    }

    async getChildrenById(params: any, req) {
        try {
            console.log(`Fetching student profile with relations for student_id: ${params.child_id}`);

            // Validate input
            if (!params.child_id || isNaN(params.child_id)) {
                throw new Error('Invalid params.child_id  provided');
            }

            const studentProfile = await StudentProfile.findOne({
                where: {
                    id: params.child_id,
                },
                include: [
                    {
                        model: School,
                        as: 'school', // Ensure this matches the alias in the model
                    },
                    {
                        model: Level,
                        as: 'level', // Ensure this matches the alias in the model
                    },
                    {
                        model: User,
                        as: 'user', // Ensure this matches the alias in the model
                    },

                    {
                        model: QuizAttempt,
                        as: 'attempted_quizes',
                        include: [
                            {
                                model: Quiz,
                                as: 'quiz', // Include quiz details
                            },
                            {
                                model: Answer,
                                as: 'answers', // Include quiz details
                            },
                        ],
                    },
                ],
            });

            if (!studentProfile) {
                throw new Error(`No student profile found for params.child_id : ${params.child_id}`);
            }

            console.log('Fetched student profile:', studentProfile);

            return {
                statusCode: HttpStatus.OK,
                data: studentProfile,
            };
        } catch (error) {
            console.error(`Error fetching student profile with relations: ${error.message}`);
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error getting students by level',
                    details: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

    }
    async getStudentsByLevel(req: any) {
        try {

            const data = await StudentProfile.findAll({

                where: {
                    level_id: {
                        [Op.eq]: req.user.level_id
                    },
                    school_id: {
                        [Op.eq]: req.user.school_id
                    },
                }
            })
            return {
                statusCode: 200,
                data: data
            }
        } catch (error) {
            throw new Error("Error getting students by level")
        }
    }


    async updateStudentProfile(updateProfileDto: UpdateStudentProfileDto, req: any) {
        try {
            const update_profile = await StudentProfile.update({
                level_id: updateProfileDto.level_id,
                user_roll_no: updateProfileDto.user_roll_no,
                parent_id: updateProfileDto.parent_id

            }, {
                where: {
                    user_id: {
                        [Op.eq]: updateProfileDto.user_id
                    }
                }
            });
            console.log("proflie updated", update_profile)

            return {
                statusCode: 200,
                message: "profile updated successfully",
                data: update_profile
            }

        } catch (error) {
            console.log(error)
            throw new Error('error updating profile')
        }
    }

}
