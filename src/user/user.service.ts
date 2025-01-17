import { UnauthorizedException, HttpStatus, Logger } from '@nestjs/common';
import {
  CreateAdminBySuperAdminDto,
  CreateUserByAdminDto,
  CreateUserDto,
  DeleteUserDto,
  GetUserDto,
  RefreshAccessToken,
  UserLoginDto,
  UserLogoutDto,
} from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

import { SendOtpDto } from './dto/send-otp.dto';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { Otp } from './entities/otp.entity';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { SignAccessToken, SignRefreshToken } from 'src/utils/signToken.utils';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RefreshToken } from './entities/refreshToken.entity';
import { VerifyRefreshToken } from 'src/utils/verifyToken.utils';
import { Role } from 'src/utils/roles.enum';

import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { Op } from 'sequelize';
import { UpdateUserDto } from './dto/update-user.dto';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Multer } from 'multer';
import { unlink } from 'fs/promises';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Response } from 'express';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { School } from 'src/school/entities/school.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';

export class UserService {
  constructor(private readonly logger = new Logger('UserService')) { }


  private generateOtp(): string {
    const otp = randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    return otp;
  }

  async sendOtpToEmail(sendOtpDto: SendOtpDto) {
    const otp = this.generateOtp();

    try {
      // Check if an OTP already exists for the email
      const existingOtp = await Otp.findOne({
        where: { email: sendOtpDto.email },
      });

      if (existingOtp) {
        // Update the existing record
        existingOtp.otp = otp;
        existingOtp.isVerified = false;
        existingOtp.updatedAt = new Date();
        await existingOtp.save();
      } else {
        // Create a new OTP record
        const otpRecord = new Otp();
        otpRecord.otp = otp;
        otpRecord.email = sendOtpDto.email;
        otpRecord.isVerified = false;
        await otpRecord.save();
      }

      this.logger.log(
        `The OTP is ${otp}, ${sendOtpDto.email}, ${process.env.EMAIL_HOST} `,
      );

      const transporter = nodemailer.createTransport({
        host: `${process.env.EMAIL_HOST}`,
        port: Number(`${process.env.EMAIL_PORT}`),
        secure: false,
        auth: {
          user: `${process.env.EMAIL_USERNAME}`,
          pass: `${process.env.EMAIL_PASSWORD}`,
        },
      });

      // Send email
      await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_ADDRESS}`,
        to: sendOtpDto.email, // Use the provided email
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}`,
        html: `<p>Your OTP is <strong>${otp}</strong></p>`,
      });

      return {
        message: 'OTP sent successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('Error sending OTP', error);
      throw new Error('Failed to send OTP');
    }
  }

  async verifyOtp(verifyOtp: VerifyOtpDto) {
    const otpRecord = await Otp.findOne({
      where: {
        otp: verifyOtp.otp,
        email: verifyOtp.email,
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid and Expired OTP');
    }
    const user = await User.findOne({
      where: {
        email: verifyOtp.email,
      },
    });

    if (!user) {
      throw new Error('Unable to Verify User');
    }

    const otpExpiry = new Date(otpRecord.createdAt);
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    if (new Date() > otpExpiry) {
      otpRecord.destroy();
      throw new Error('Invalid or Expired OTP ');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return {
      message: 'OTP verified successfully',
      statusCode: HttpStatus.OK,
      data: {
        success: true,
      },
    };
  }

  async updateUser(updateUserDto: UpdateUserDto, req: any) {
    const { id, name, contact, email, isVerified, is_verified_by_admin, oldPassword, newPassword } = updateUserDto;

    // Fetch the user from the database
    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Handle password update if oldPassword and newPassword are provided
    if (oldPassword && newPassword) {
      // Validate the old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save(); // Save the updated password
    }

    // Update profile fields
    const updatedFields = {
      name: name || user.name,
      contact: contact || user.contact,
      email: email || user.email,
      isVerified: isVerified !== undefined ? isVerified : user.isVerified,
      is_verified_by_admin: is_verified_by_admin !== undefined ? is_verified_by_admin : user.is_verified_by_admin,
    };

    await User.update(updatedFields, {
      where: { id },
    });

    return {
      message: 'Successfully updated the user',
      statusCode: HttpStatus.OK,
    };
  }


  async updatePassword(createForgotDto: UpdatePasswordDto, req: any) {
    const { password, otp, email } = createForgotDto;

    const otpRecord = await Otp.findOne({
      where: {
        otp,
        email,
        isVerified: true,
      },
    });

    if (!otpRecord) {
      throw new Error('Unable to Update password');
    }
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error('Unable to Update password');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    await otpRecord.destroy();

    return {
      message: 'Successfully updated the password',
      statusCode: HttpStatus.OK,
    };
  }


  async deleteTeacher(deleteUserDto: DeleteUserDto) {
    try {

      await JoinTeacherSubjectLevel.destroy({
        where: {
          teacher_id: {
            [Op.eq]: deleteUserDto.user_id
          }
        }
      }).then(async () => {
        await TeacherProfile.destroy({
          where: {
            user_id: {
              [Op.eq]: deleteUserDto.user_id
            }
          }
        }).then(async () => {
          await Otp.destroy({
            where: {
              user_id: {
                [Op.eq]: deleteUserDto.user_id
              }
            }
          })
          await Chat.destroy({
            where: {
              user_id: {
                [Op.eq]: deleteUserDto.user_id
              }
            }
          })
          await RefreshToken.destroy({
            where: {
              user_id: {
                [Op.eq]: deleteUserDto.user_id
              }
            }
          })
          await User.destroy({
            where: {
              id: {
                [Op.eq]: deleteUserDto.user_id
              }
            }
          })
        })
      })


      return {
        statusCode: 200,
        message: "success deleting user"
      }
    } catch (error) {
      throw new Error("ERROR DELETING USER")
    }
  }

  async deleteUser(deleteUserDto: DeleteUserDto) {
    try {

      await StudentProfile.destroy({
        where: {
          user_id: {
            [Op.eq]: deleteUserDto.user_id
          }
        }
      }).then(async () => {



        await User.destroy({
          where: {
            id: {
              [Op.eq]: deleteUserDto.user_id
            }
          }
        })
      })
      return {
        statusCode: 200,
        message: "success deleting user"
      }
    } catch (error) {
      throw new Error("ERROR DELETING USER")
    }
  }
  async deleteParent(deleteUserDto: DeleteUserDto) {
    try {

      await ParentProfile.destroy({
        where: {
          user_id: {
            [Op.eq]: deleteUserDto.user_id
          }
        }
      }).then(async () => {



        await User.destroy({
          where: {
            id: {
              [Op.eq]: deleteUserDto.user_id
            }
          }
        })
      })
      return {
        statusCode: 200,
        message: "success deleting parent"
      }
    } catch (error) {
      throw new Error("ERROR DELETING Parent")
    }
  }


  async createAdmin(createAdminBySuperAdminDto: CreateAdminBySuperAdminDto) {
    const existingUser = await User.findOne({
      where: { email: createAdminBySuperAdminDto.email },
    });
    if (existingUser) {
      return {
        message: 'Admin Already Exist',
        statusCode: 1000,
        user: {
          isVerified: existingUser.isVerified,
        },
      };
    }
    const hashedPassword = await bcrypt.hash(createAdminBySuperAdminDto.password, 10);

    const res = await User.create({
      name: createAdminBySuperAdminDto.name,
      email: createAdminBySuperAdminDto.email,
      password: hashedPassword,
      contact: createAdminBySuperAdminDto.contact,
      role: createAdminBySuperAdminDto.role,
      isVerified: true
    }).then(async (u) => {

      await AdminProfile.create({
        id: u.id,
        user_id: u.id,
        school_id: createAdminBySuperAdminDto.school_id
      })

      return u
    });
    return {
      message: 'Admin successfully registered.',
      statusCode: HttpStatus.OK,
      data: {
        id: res.id,
        name: res.name,
        email: res.email,
      },
    };
  }


  async createUser(createUserByAdminDto: CreateUserByAdminDto, req: any) {
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({
        where: { email: createUserByAdminDto.email },
      });
      if (existingUser) {
        return {
          message: 'User already exists',
          statusCode: 1000,
          user: {
            isVerified: existingUser.isVerified,
          },
        };
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(createUserByAdminDto.password, 10);
  
      // Create the user and associated profile based on the role
      const res = await User.create({
        name: createUserByAdminDto.name,
        email: createUserByAdminDto.email,
        password: hashedPassword,
        contact: createUserByAdminDto.contact,
        role: createUserByAdminDto.role,
        isVerified: true,
      }).then(async (u) => {
        if (createUserByAdminDto.role == Role.USER) {
          await StudentProfile.create({
            level_id: createUserByAdminDto.level_id,
            user_id: u.id,
            user_roll_no: createUserByAdminDto.user_roll_no,
            id: u.id,
            school_id: req.user.school_id,
            parent_id: createUserByAdminDto.parent_id,
          });
        } else if (createUserByAdminDto.role == Role.TEACHER) {
          await TeacherProfile.create({
            user_id: u.id,
            id: u.id,
            title: "",
            level_id: createUserByAdminDto.level_id,
            school_id: req.user.school_id,
          });
        } else if (createUserByAdminDto.role == Role.PARENT) {
          await ParentProfile.create({
            user_id: u.id,
            id: u.id,
            school_id: req.user.school_id,
          });
        }
        return u;
      });
  
      // Return success response
      return {
        message: 'User successfully registered.',
        statusCode: HttpStatus.OK,
        data: {
          id: res.id,
          name: res.name,
          email: res.email,
        },
      };
    } catch (error) {
      // Handle errors and log them if necessary
      console.error('Error in createUser:', error);
  
      return {
        message: 'An error occurred while creating the user.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message || 'Internal Server Error',
      };
    }
  }
  


  async signup(createUserDto: CreateUserDto, res: Response) {
    console.log(createUserDto)

    const existingUser = await User.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      return {
        message: 'Email Already Exist',
        statusCode: 1000,
        user: {
          isVerified: existingUser.isVerified,
        },
      };
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = new User();
    newUser.name = createUserDto.name;
    newUser.email = createUserDto.email;
    newUser.password = hashedPassword;
    newUser.contact = createUserDto.contact;
    newUser.role = Role.USER
    newUser.save().then(async (u) => {
      await StudentProfile.create({
        level_id: null,
        school_id: null,
        user_id: u.id,
        user_roll_no: "",
        id: u.id
      })
    });

    await this.sendOtpToEmail({ email: newUser.email })
      .then(() => {
        res.status(HttpStatus.OK).send({
          message: 'You have successfully registered.',
          statusCode: HttpStatus.OK,
          data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          },
        })
        return
      })
      .catch(() => {
        throw new Error("Unable to email verification code")
      })

  }

  async verifyUser(verifyOtp: VerifyOtpDto) {
    const otpRecord = await Otp.findOne({
      where: {
        otp: verifyOtp.otp,
        email: verifyOtp.email,
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid and Expired OTP');
    }
    const user = await User.findOne({
      where: {
        email: verifyOtp.email,
      },
    });

    if (!user) {
      throw new Error('Unable to Verify User');
    }

    const otpExpiry = new Date(otpRecord.createdAt);
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    if (new Date() > otpExpiry) {
      otpRecord.destroy();
      throw new Error('Invalid or Expired OTP ');
    }

    user.isVerified = true;
    await user.save();

    await otpRecord.destroy();

    return {
      message: 'OTP verified successfully',
      statusCode: HttpStatus.OK,
      data: {
        success: true,
      },
    };
  }

  async generateRefreshToken(payload: {
    sub: number;
    email: string;
    level_id: number | null;
    school_id: number | null;
    role: string
  }): Promise<string> {
    const refreshToken = SignRefreshToken(payload);
    try {
      await RefreshToken.create({
        user_id: payload.sub,
        refresh_token: refreshToken
      })
      return refreshToken;
    } catch (error) {
      return '';
    }
  }

  async refreshAccessToken(refreshAccessToken: RefreshAccessToken) {
    const { refresh_token } = refreshAccessToken;

    const token_exist = await RefreshToken.findOne({
      where: {
        refresh_token,
      },
    });

    if (!token_exist) {
      throw new Error('Invalid or expired refresh token');
    }

    const verifyToken: any = await VerifyRefreshToken(refresh_token);

    if (verifyToken.email == '') {
      throw new Error('Token expired or invalid');
    }

    const payload = { sub: verifyToken?.sub, email: verifyToken.email, role: verifyToken?.role, level_id: verifyToken?.level_id ? verifyToken.level_id : null, school_id: verifyToken?.school_id ? verifyToken.school_id : null };

    console.log("payload in refresh access token", payload)
    const accessToken = SignAccessToken(payload);

    return {
      accessToken: accessToken,
      statusCode: 200,
    };
  }

  async logout(userLogoutDto: UserLogoutDto) {
    const { refresh_token } = userLogoutDto;
    console.log("logout")
    try {
      await RefreshToken.destroy({
        where: {
          refresh_token: {
            [Op.eq]: refresh_token
          },
        },
      });
      return {
        message: 'LogOut successful',
        statusCode: 200,
      };
    } catch (error) {
      throw new Error('Failed To LogOut');
    }
  }

  async login(userLoginDto: UserLoginDto) {
    const { email, password } = userLoginDto;
    this.logger.log(`USER login creadentaila , ${userLoginDto}`);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('No User exist');
    }

    let profile: any;
    if (user.role == Role.USER) {
      profile = await StudentProfile.findOne({
        where: {
          user_id: {
            [Op.eq]: user.id
          }
        }
      })
    } else if (user.role == Role.TEACHER) {
      profile = await TeacherProfile.findOne({
        where: {
          user_id: {
            [Op.eq]: user.id
          }
        }
      })
    } else if (user.role == Role.ADMIN) {
      profile = await AdminProfile.findOne({
        where: {
          user_id: {
            [Op.eq]: user.id
          }
        }
      })
    }
    else if (user.role == Role.PARENT) {
      profile = await ParentProfile.findOne({
        where: {
          user_id: {
            [Op.eq]: user.id
          }
        }
      })
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    //check if refresh token already exist as user id is unique
    const refresh_token_exist = await RefreshToken.findOne({
      where: {
        user_id: {
          [Op.eq]: user?.id
        }
      }
    })

    let refreshToken = ""
    const payload = { sub: user.id, email: user.email, role: user?.role, level_id: profile?.level_id ? profile.level_id : null, school_id: profile?.school_id ? profile.school_id : null };
    if (refresh_token_exist) {
      refreshToken = refresh_token_exist?.refresh_token
      console.log("using old refresh key")
    } else {
      refreshToken = await this.generateRefreshToken(payload);
      console.log("using new refresh key")
    }

    if (refreshToken == '') {
      throw new Error('Fialed to LogIn');
    }
    const accessToken = SignAccessToken(payload);

    this.logger.log(
      `jwt access token ${accessToken} \n jwt refresh token ${refreshToken}`,
    );
    return {
      message: 'Login successful.',
      statusCode: 200,
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          level_id: profile?.level_id ? profile.level_id : null,
          school_id: profile?.school_id ? profile.school_id : null

        },
      },
    };
  }


  async getAllUsersByRole(role: Role, req: any, page?: number, limit?: number) {
    try {
      let users;
      let total;

      if (page && limit) {
        // Pagination logic
        const offset = (page - 1) * limit;
        const result = await User.findAndCountAll({
          include: [
            {
              model: StudentProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }],
              where: {

                school_id: {
                  [Op.eq]: req.user.school_id
                }
              },
            },
            {
              model: TeacherProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }],
              where: {

                school_id: {
                  [Op.eq]: req.user.school_id
                }
              },
            },
            {
              model: ParentProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }],
              where: {

                school_id: {
                  [Op.eq]: req.user.school_id
                }
              },
            }
          ],
          attributes: {
            exclude: ['password'], // Exclude sensitive information
          },
          where: {
            role: {
              [Op.eq]: role, // Filter users by role
            }
          },
          limit,
          offset,
        });
        users = result.rows;
        total = result.count;
      } else {
        // Return all users if page and limit are not provided
        users = await User.findAll({
          include: [
            {
              model: StudentProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }]
              ,
              where: {
                role: {
                  [Op.eq]: role, // Filter users by role
                }
              },
            },
            {
              model: TeacherProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }]
              ,
              where: {
                role: {
                  [Op.eq]: role, // Filter users by role
                }
              },
            },
            {
              model: ParentProfile,
              required: false,
              attributes: [],
              include: [{
                model: School
              }]
              ,
              where: {
                role: {
                  [Op.eq]: role, // Filter users by role
                }
              },
            }
          ],
          attributes: {
            exclude: ['password'], // Exclude sensitive information
          },
          where: {
            role: {
              [Op.eq]: role, // Filter users by role
            }
          },
        });
        total = users.length;
      }

      return {
        statusCode: 200,
        users,
        total,
        page: page || 1, // Default to page 1 if not provided
        limit: limit || total, // Default to total number of users if not provided
      };
    } catch (error) {
      console.log("error", error)
      throw new Error('Error fetching users');
    }
  }


  async updateAvatar(image: Express.Multer.File, req: any) {
    try {
      const user = await User.findByPk(req.sub, {
        attributes: ["user_image_url"],
      });
  
      // Delete the old avatar if it exists
      if (user?.user_image_url) {
        await unlink(user.user_image_url);
      }
  
      // Update the user's avatar URL in the database
     
      // Construct the public URL for the avatar
      const avatarUrl = `${req.protocol}://${req.get('host')}/images/${image.filename}`;
      await User.update(
        {
          user_image_url: avatarUrl, // Store the local file path
        },
        {
          where: {
            id: {
              [Op.eq]: req.user.sub,
            },
          },
        }
      );
  
      return {
        statusCode: 200,
        message: "Avatar updated successfully",
        data: {
          avatarUrl, // Return the public URL
        },
      };
    } catch (error) {
      console.error("Error updating avatar:", error);
      throw new Error("Error updating avatar");
    }
  }

  async getUser(getStudentDto: GetUserDto, req: any) {
    try {
      const student = await User.findByPk(getStudentDto.user_id, {
        attributes: {
          exclude: ["password"]
        },
        include: [{
          model: StudentProfile
        }]
      })

      return {
        statusCode: 200,
        data: student
      }

    } catch (error) {
      throw new Error("Error fetching students")
    }
  }

}
