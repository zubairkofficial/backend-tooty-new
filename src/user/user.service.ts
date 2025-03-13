import { UnauthorizedException, HttpStatus, Logger, HttpException, Injectable } from '@nestjs/common';
import {
  CreateUserByAdminDto,
  CreateUserDto,
  DeleteUserDto,
  GetUserDto,
  RefreshAccessToken,
  StudentLoginDto,
  UserLoginDto,
  UserLogoutDto,
} from './dto/user.dto';
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
import { UpdateProfileDto, UpdateUserDto } from './dto/user.dto';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Multer } from 'multer';
import { unlink } from 'fs/promises';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Response } from 'express';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { School } from 'src/school/entities/school.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';
import { Sequelize } from 'sequelize-typescript';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { InjectConnection } from '@nestjs/sequelize';
import { Subject } from 'src/subject/entity/subject.entity';
import { District } from 'src/district/entity/district.entity';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { JoinSchoolAdmin } from 'src/school/entities/join-school-admin.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService')
  constructor(

    private readonly sequelize: Sequelize

  ) { }


  private generateOtp(): string {
    const otp = randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    return otp;
  }

  async sendOtpToEmail(sendOtpDto: SendOtpDto) {
    const otp = this.generateOtp();

    try {
      const user = await User.findOne({
        where: {
          email: {
            [Op.eq]: sendOtpDto.email
          }
        }
      })
      if (!user) {
        throw new Error("User Does Not Exist")
      }
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyOtp(verifyOtp: VerifyOtpDto) {
    try {
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }



  async updateProfile(updateUserDto: UpdateProfileDto, req: any) {
    const { name, contact, oldPassword, newPassword } = updateUserDto;

    try {
      if (name && contact) {
        // Update name and contact
        await User.update(
          { name, contact },
          {
            where: {
              id: {
                [Op.eq]: req.user.sub,
              },
            },
          },
        );

        return {
          message: 'Successfully updated the user profile',
          statusCode: HttpStatus.OK,
        };
      }

      if (oldPassword && newPassword) {
        // Fetch the user from the database
        const user = await User.findOne({
          where: {
            id: {
              [Op.eq]: req.user.sub,
            },
          },
        });

        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        // Validate the old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
          throw new HttpException('Old password is incorrect', HttpStatus.BAD_REQUEST);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save(); // Save the updated password

        return {
          message: 'Successfully updated the password',
          statusCode: HttpStatus.OK,
        };
      }

      // If neither name/contact nor password is provided
      throw new HttpException('No valid fields provided for update', HttpStatus.BAD_REQUEST);
    } catch (error) {
      // Handle errors and send them to the frontend
      if (error instanceof HttpException) {
        throw error; // Re-throw HttpException to send it to the frontend
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async updateUser(updateUserDto: UpdateUserDto, req: any) {
    const { id, name, contact, email, isVerified } = updateUserDto;

    try {


      // Fetch the user from the database
      const user = await User.findOne({
        where: { id },
      });

      const user_exist_email = await User.findOne({
        where: {
          email: {
            [Op.eq]: updateUserDto.email
          }
        }
      })

      if (user_exist_email && user_exist_email.email !== user.email) {
        throw new Error("Email with user already exist")
      }

      if (!user) {
        throw new Error('User not found');
      }



      user.name = name;
      user.contact = contact;
      user.email = email;
      user.isVerified = isVerified

      await user.save()


      return {
        message: 'Successfully updated the user',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.log(error.message)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }


  async updatePassword(createForgotDto: UpdatePasswordDto, req: any) {
    const { password, otp, email } = createForgotDto;

    try {
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
          email: {
            [Op.eq]: email
          }
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

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }


  private async deleteUser(id: number, district_id: number | null | undefined, school_id: number | null | undefined) {
    try {
      await User.destroy({
        where: {
          id: {
            [Op.eq]: id
          }
        }
      })
      return {
        statusCode: 200,
        message: "User deleted successfully"
      }
    } catch (error) {
      throw new Error("Error deleting user" + error.message)
    }
  }

  async deleteUserService(deleteUserDto: DeleteUserDto, req: any) {
    console.log(req.user)
    try {
      const user = await User.findByPk(deleteUserDto.user_id, {
        include: [{
          required: false,
          model: SuperIntendentProfile
        },
        {
          required: false,
          model: AdminProfile
        },
        {
          required: false,
          model: TeacherProfile
        },
        {
          required: false,
          model: StudentProfile
        },
        {
          required: false,
          model: StudentProfile
        }]
      })

      switch (user.role) {

        case Role.SUPER_INTENDENT:
          if (req.user.role !== Role.SUPER_ADMIN) {
            throw new Error("Invalid Role")
          }
          await this.deleteUser(deleteUserDto.user_id, null, null);
          break;

        case Role.ADMIN:
          if (req.user.role !== Role.SUPER_INTENDENT) {
            throw new Error("Invalid Role")
          }
          if (!user.admin_profile.district_id) {
            console.log("could not find district_id")
            throw new Error("Error deleting principal")
          }
          if (user.admin_profile.district_id !== req.user.district_id) {
            throw new Error("UnAuthorized - district_id dont match")
          }
          await this.deleteUser(deleteUserDto.user_id, req.user.district_id, null);
          break;

        case Role.USER:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("Invalid Role")
          }
          if (!user.student_profile.school_id) {
            console.log("could not find school_id")
            throw new Error("Error deleting student")
          }
          if (user.student_profile.school_id !== req.user.school_id) {
            throw new Error("UnAuthorized - school_id dont match")
          }
          await this.deleteUser(deleteUserDto.user_id, null, req.user.school_id);
          break;

        case Role.TEACHER:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("Invalid Role")
          }
          if (!user.teacher_profile.school_id) {
            console.log("could not find school_id")
            throw new Error("Error deleting teacher")
          }
          if (user.teacher_profile.school_id !== req.user.school_id) {
            throw new Error("UnAuthorized - school_id dont match")
          }
          await this.deleteUser(deleteUserDto.user_id, null, req.user.school_id);
          break;

        case Role.PARENT:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("Invalid Role")
          }
          if (!user.parent_profile.school_id) {
            console.log("could not find school_id")
            throw new Error("Error deleting parent")
          }
          if (user.parent_profile.school_id !== req.user.school_id) {
            throw new Error("UnAuthorized - school_id dont match")
          }
          await this.deleteUser(deleteUserDto.user_id, null, req.user.school_id);
          break;



        default:
          throw new HttpException('Invalid user Role', HttpStatus.BAD_REQUEST);

      }

      return {
        statusCode: 200,
        message: "User deleted successfully"
      }

    } catch (error) {
      console.log("error deleting user", error)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async createUser(createUserDto: CreateUserByAdminDto, req: any) {
    const transaction = await this.sequelize.transaction(); // Start Transaction

    console.log("create user dto", createUserDto)

    try {


      //if role is student then we will do all validation using roll no --- else email
      // Check if email already exists
      let existingUser = null

      if (createUserDto.role === Role.USER) {
        existingUser = await User.findOne({
          include: [{
            required: true,
            model: StudentProfile,
            where: {
              user_roll_no: {
                [Op.eq]: createUserDto.user_roll_no
              }
            }
          }],
          paranoid: false,
          transaction
        });
      } else {
        if (!createUserDto.email) {
          throw new HttpException(`Email is required to create ${createUserDto.role}`, HttpStatus.BAD_REQUEST);
        }
        existingUser = await User.findOne({
          where: {
            email: {
              [Op.eq]: createUserDto.email
            }
          },
          paranoid: false,
          transaction
        });
      }

      if (existingUser) {
        throw new HttpException('User with email already exists', HttpStatus.BAD_REQUEST);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user inside transaction
      const user = await User.create(
        {
          name: createUserDto.name,
          email: createUserDto?.email,
          password: hashedPassword,
          contact: createUserDto.contact,
          role: createUserDto.role,
          isVerified: true,
        },
        { transaction }
      );

      // Role-Specific Profile Handling
      switch (createUserDto.role) {
        case Role.SUPER_INTENDENT:
          if (req.user.role !== Role.SUPER_ADMIN) {
            throw new Error("UnAuthorized")
          }
          if (!createUserDto.district_id) throw new Error('District ID is required for Super Intendent');
          await SuperIntendentProfile.create({ id: user.id, user_id: user.id, district_id: createUserDto.district_id }, { transaction });
          break;

        case Role.ADMIN:
          if (req.user.role !== Role.SUPER_INTENDENT) {
            throw new Error("UnAuthorized")
          }
          if (!createUserDto.school_id) throw new Error('School ID is required for Admin');
          await AdminProfile.create({ id: user.id, user_id: user.id, district_id: req.user.district_id }, { transaction });
          await JoinSchoolAdmin.create({ admin_id: user.id, school_id: createUserDto.school_id }, { transaction })
          break;

        case Role.USER:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("UnAuthorized")
          }
          if (!createUserDto.level_id || !createUserDto.parent_id) throw new Error('Level and Parent ID are required for Student');
          await StudentProfile.create(
            {
              id: user.id,
              user_id: user.id,
              level_id: createUserDto.level_id,
              parent_id: createUserDto.parent_id,
              user_roll_no: createUserDto.user_roll_no,
              school_id: req.user.school_id,
            },
            { transaction }
          );
          break;

        case Role.TEACHER:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("UnAuthorized")
          }
          if (!createUserDto.level_id) throw new Error('Level is required for Teacher');
          const teacher = await TeacherProfile.create(
            { id: user.id, user_id: user.id, level_id: createUserDto.level_id, school_id: req.user.school_id },
            { transaction }
          );

          for (const subjectId of createUserDto.subjects) {
            await JoinTeacherSubjectLevel.create(
              { level_id: createUserDto.level_id, subject_id: subjectId, teacher_id: teacher.id },
              { transaction }
            );
          }
          break;

        case Role.PARENT:
          if (req.user.role !== Role.ADMIN) {
            throw new Error("UnAuthorized")
          }
          await ParentProfile.create({ id: user.id, user_id: user.id, school_id: req.user.school_id }, { transaction });
          break;

        default:
          throw new HttpException('Invalid user Role', HttpStatus.BAD_REQUEST);
      }

      // Commit Transaction if everything is successful
      await transaction.commit();
      try {
        // Send email after successful commit
        await this.sendAccountCreationEmail(user, createUserDto.password);

      } catch (error) {
        throw new Error("Failed to send email to user - user created succesfully")
      }

      return {
        message: 'User successfully registered.',
        statusCode: HttpStatus.OK,
        data: { id: user.id, name: user.name, email: user.email },
      };

    } catch (error) {
      // Rollback Transaction in case of an error
      console.error("error creating user", error)
      await transaction.rollback();
      throw new HttpException(error.message || 'Failed to create user', error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async sendAccountCreationEmail(user: any, password: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS,
      to: user.email,
      subject: `Welcome to Tooty, ${user.role}`,
      text: `Your account has been created. Email: ${user.email}, Password: ${password}`,
      html: `<p>Welcome to Tooty! Your credentials: <strong>Email:</strong> ${user.email}, <strong>Password:</strong> ${password}</p>`,
    });
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
    try {
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }

  async generateRefreshToken(payload: {
    sub: number;
    email: string;
    level_id: number | null;
    school_id: number | null;
    role: string
    district_id: number | null
    user_roll_no: string | null
  }): Promise<string> {
    const refreshToken = SignRefreshToken(payload);
    try {
      await RefreshToken.create({
        user_id: payload.sub,
        refresh_token: refreshToken
      })
      return refreshToken;
    } catch (error) {
      console.log("refresh token generte error", error)
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

    const payload = { sub: verifyToken?.sub, email: verifyToken.email, role: verifyToken?.role, level_id: verifyToken?.level_id || null, school_id: verifyToken?.school_id || null, district_id: verifyToken.district_id || null, user_roll_no: verifyToken?.user_roll_no || null };

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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loginStudent(studentLoginDto: StudentLoginDto) {
    try {
      const { user_roll_no, password } = studentLoginDto;
      this.logger.log(`student login creadentaila , ${studentLoginDto}`);
      const user = await User.findOne({
        include: [{
          required: true,
          model: StudentProfile,
          where: {
            user_roll_no: {
              [Op.eq]: user_roll_no
            }
          }
        }]
      });

      if (!user) {
        throw new UnauthorizedException('No User exist');
      }

      const subFncData = await this.loginSubFunction(user, password)

      if (subFncData instanceof HttpException || subFncData instanceof UnauthorizedException || subFncData instanceof Error) {
        throw new HttpException(
          subFncData?.message || "Error user login",
          HttpStatus.BAD_REQUEST
        );
      }

      if (subFncData?.accessToken !== "" && subFncData?.refreshToken !== "") {
        return {
          message: 'Login successful.',
          statusCode: 200,
          data: {
            accessToken: subFncData?.accessToken,
            refreshToken: subFncData?.refreshToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              contact: user.contact,
              user_image_url: user.user_image_url,
              role: user.role,
              user_roll_no: user.student_profile.user_roll_no

            }
          },
        };
      } else {
        throw new HttpException("Error Login", HttpStatus.INTERNAL_SERVER_ERROR)
      }



    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }

  async login(userLoginDto: UserLoginDto) {
    try {
      const { email, password } = userLoginDto;
      this.logger.log(`USER login creadentaila , ${userLoginDto}`);
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        throw new UnauthorizedException('No User exist');
      }

      const subFncData = await this.loginSubFunction(user, password)

      if (subFncData instanceof HttpException || subFncData instanceof UnauthorizedException || subFncData instanceof Error) {
        throw new HttpException(
          subFncData?.message || "Error user login",
          HttpStatus.BAD_REQUEST
        );
      }

      if (subFncData?.accessToken !== "" && subFncData?.refreshToken !== "") {
        return {
          message: 'Login successful.',
          statusCode: 200,
          data: {
            accessToken: subFncData?.accessToken,
            refreshToken: subFncData?.refreshToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              contact: user.contact,
              user_image_url: user.user_image_url,
              role: user.role,
              user_roll_no: null
            }
          },
        };
      } else {
        throw new HttpException("Error Login", HttpStatus.INTERNAL_SERVER_ERROR)
      }



    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }

  async loginSubFunction(user: User, loginPassword: string) {
    try {
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
        const school = await JoinSchoolAdmin.findOne({
          where: {
            admin_id: {
              [Op.eq]: user.id
            }
          }
        })
        profile.school_id = school?.school_id
      }
      else if (user.role == Role.PARENT) {
        profile = await ParentProfile.findOne({
          where: {
            user_id: {
              [Op.eq]: user.id
            }
          }
        })
      } else if (user.role == Role.SUPER_ADMIN) {
        profile = await SuperAdminProfile.findOne({
          where: {
            user_id: {
              [Op.eq]: user.id
            }
          }
        })
      } else if (user.role == Role.SUPER_INTENDENT) {
        profile = await SuperIntendentProfile.findOne({
          where: {
            user_id: {
              [Op.eq]: user.id
            }
          }
        })
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
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
      console.log("profile", profile)

      const payload = { sub: user.id, email: user.email, role: user?.role, level_id: profile?.level_id || null, school_id: profile?.school_id || null, district_id: profile?.district_id || null, user_roll_no: profile?.user_roll_no || null };

      if (refresh_token_exist) {
        refreshToken = refresh_token_exist?.refresh_token
        console.log("using old refresh key")
      } else {
        refreshToken = await this.generateRefreshToken(payload);
        console.log("using new refresh key")
      }

      if (refreshToken === '') {
        throw new HttpException('Fialed to LogIn - refreshtoken error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      const accessToken = SignAccessToken(payload);

      if (!accessToken) {
        throw new HttpException('Fialed to LogIn - accessToken error', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(
        `jwt access token ${accessToken} \n jwt refresh token ${refreshToken}`,
      );

      return {
        accessToken,
        refreshToken
      }
    } catch (error) {
      return error
    }

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
              required: role === Role.USER,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

            },
            {
              model: TeacherProfile,
              required: role === Role.TEACHER,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

            },
            {
              model: ParentProfile,
              required: role === Role.PARENT,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

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
              required: role === Role.USER,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

            },
            {
              model: TeacherProfile,
              required: role === Role.TEACHER,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

            },
            {
              model: ParentProfile,
              required: role === Role.PARENT,
              attributes: ["id", "school_id"],
              include: [{
                model: School,
                where: {

                  id: {
                    [Op.eq]: req.user.school_id
                  }
                },
              }],

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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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

      await User.update(
        {
          user_image_url: image.filename, // Store the local file path
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
          avatarUrl: image.filename, // Return the public URL
        },
      };
    } catch (error) {
      console.error("Error updating avatar:", error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUser(user_id: number, req: any) {
    try {
      const student = await User.findByPk(user_id, {
        attributes: {
          exclude: ["password"]
        },
        include: [{
          required: false,
          model: StudentProfile
        },
        {
          required: false,
          model: TeacherProfile,
          include: [{
            required: false,
            model: Subject
          }]
        },
        {
          required: false,
          model: AdminProfile,
          include: [{
            required: false,
            model: School
          }]
        },
        {
          required: false,
          model: SuperIntendentProfile,
          include: [{
            required: false,
            model: District
          }]
        },
        {
          required: false,
          model: ParentProfile
        }
        ]
      })

      return {
        statusCode: 200,
        data: student
      }

    } catch (error) {
      throw new HttpException(error.message || `Failed to get user with id ${user_id}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
