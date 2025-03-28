// src/services/Quiz.service.ts
import { Injectable, BadRequestException, NotFoundException, HttpException, InternalServerErrorException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
import { Question } from 'src/question/entities/question.entity';
import { CreateQuizDto, EditQuizDto } from './dto/create-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { Option } from 'src/option/entities/option.entity';
import { QuizType } from 'src/utils/quizType.enum';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript'
import { Role } from 'src/utils/roles.enum';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Notification } from 'src/notification/entity/notification.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz)
    private readonly quizModel: typeof Quiz,
    @InjectModel(Level)
    private readonly levelModel: typeof Level,
    @InjectModel(Subject)
    private readonly subjectModel: typeof Subject,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Option)
    private readonly optionModel: typeof Option,
    private readonly sequelize: Sequelize,
  ) { }

  async create(createQuizDto: CreateQuizDto, req: any) {
    const transaction = await this.sequelize.transaction()
    try {
      const { title, description, quiz_type, start_time, end_time, duration, subject_id, questions } = createQuizDto;

      if ((start_time === null) !== (end_time === null)) {
        throw new Error("Both start_time & end_time can be null, or both must be defined");
      }
      if (start_time !== null && end_time !== null) {
        // Parse the incoming dates as UTC
        const quizStartTime = new Date(`${start_time}T00:00:00Z`);
        const quizEndTime = new Date(`${end_time}T00:00:00Z`);

        // Get the current UTC date (without time)
        const now = new Date();
        const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Check if the quiz start time is in the past (compared to UTC date only)
        if (quizStartTime < currentUTCDate) {
          throw new Error("start_time must be greater than or equal to the current UTC date");
        }

        // Check if start_time is greater than or equal to end_time
        if (quizStartTime >= quizEndTime) {
          throw new BadRequestException('Start time must be before end time');
        }
      }

      // Check if level and subject exist
      const level = await this.levelModel.findByPk(req.user.level_id, {
        transaction
      });
      if (!level) {
        throw new NotFoundException(`Level with ID ${req.user.level_id} not found`);
      }

      const subject = await this.subjectModel.findByPk(subject_id, {
        transaction
      });
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${subject_id} not found`);
      }

      // Initialize total score
      let totalScore = 0;

      // Create the quiz
      const quiz = await this.quizModel.create({
        title,
        description,
        quiz_type: quiz_type === QuizType.MCQS ? QuizType.MCQS : QuizType.QA,
        start_time: start_time,
        end_time: end_time,
        duration,
        level_id: req.user.level_id,
        subject_id,
        teacher_id: req.user.sub,
      }, {
        transaction
      });

      // Add questions and options
      for (const questionDto of questions) {
        // Create question with score from the DTO
        const question = await this.questionModel.create({
          text: questionDto.text,
          question_type: questionDto.questionType === "multiple-choice" ? QuizType.MCQS : QuizType.QA,
          quiz_id: quiz.id,
          score: questionDto.score, // Add the score for the question
        }, {
          transaction
        });

        totalScore += questionDto.score;
        question.score = questionDto.score;

        if (quiz.quiz_type === QuizType.MCQS) {
          // Add options for multiple-choice questions
          for (const optionDto of questionDto.options) {
            await this.optionModel.create({
              text: optionDto.text,
              is_correct: optionDto.isCorrect,
              question_id: question.id,
            }, {
              transaction
            });
          }
        }
      }

      // Update quiz total score
      quiz.total_score = totalScore;
      await quiz.save({ transaction });


      await Notification.create({
        title: `Quiz: ${quiz.title}`,
        level_id: req.user.level_id,
        school_id: req.user.school_id
      }, {
        transaction
      })

      await transaction.commit()

      return {
        statusCode: 200,
        message: "Quiz created successfully"
      }
    } catch (error) {
      await transaction.rollback()
      throw new HttpException(error.message || 'Failed to create quiz', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async editQuiz(editQuizDto: EditQuizDto, req: any) {
    const transaction = await this.sequelize.transaction();
    const { title, description, start_time, end_time, duration, subject_id, questions } = editQuizDto;
    try {
      if ((start_time === null) !== (end_time === null)) {
        throw new Error("Both start_time & end_time can be null, or both must be defined");
      }

      let totalScore = 0;
      const quiz = await this.quizModel.findByPk(editQuizDto.id, { transaction });
      if (!quiz) {
        throw new NotFoundException(`Quiz with ID ${editQuizDto.id} not found`);
      }
      if (start_time === null && end_time === null) {
        quiz.start_time = start_time;
        quiz.end_time = end_time
      }

      if (start_time && end_time) {

        // Get the current UTC date (without time)
        const currentDate = new Date();
        const currentUTCDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));

        if (quiz.start_time !== null) {
          // Check if the quiz has already started
          if (currentUTCDate >= new Date(quiz.start_time)) {
            throw new BadRequestException('Quiz cannot be edited after it has started');
          }
        }


        // Parse the incoming dates as UTC
        if (start_time) {
          const quizStartTime = new Date(`${start_time}T00:00:00Z`);

          // Check if the new start_time is in the past
          if (quizStartTime < currentUTCDate) {
            throw new BadRequestException('start_time must be greater than or equal to the current UTC date');
          }


          quiz.start_time = start_time;
        }

        if (end_time) {
          const quizEndTime = new Date(`${end_time}T00:00:00Z`);

          // Check if the new end_time is less than the new start_time
          if (quizEndTime <= new Date(quiz.start_time)) {
            throw new BadRequestException('End time must be after start time');
          }

          quiz.end_time = end_time;
        }
      }

      // Update quiz fields if provided
      if (title) quiz.title = title;
      if (description) quiz.description = description;
      if (duration) quiz.duration = duration;

      if (subject_id) {
        const subject = await this.subjectModel.findByPk(subject_id, { transaction });
        if (!subject) {
          throw new NotFoundException(`Subject with ID ${subject_id} not found`);
        }
        quiz.subject_id = subject_id;
      }

      await quiz.save({ transaction });

      // Handle questions and options
      if (questions) {
        for (const questionDto of questions) {
          let question = await this.questionModel.findByPk(questionDto.id, { transaction });

          // If the question doesn't exist, create it
          if (!question) {
            question = await this.questionModel.create(
              {
                quiz_id: quiz.id,
                text: questionDto.text,
                score: questionDto.score,
                question_type: quiz.quiz_type == QuizType.QA ? QuizType.QA : QuizType.MCQS,
              },
              { transaction }
            );
          } else {
            if (questionDto.text) {
              question.text = questionDto.text;
            }
            if (quiz.quiz_type === QuizType.QA && questionDto.score) {
              question.score = questionDto.score;
            }
          }

          await question.save({ transaction });

          totalScore += question.score; // Use the score provided for QA

          // Handle options for MCQS type
          if (quiz.quiz_type === QuizType.MCQS && questionDto.options) {
            for (const optionDto of questionDto.options) {
              let option = await this.optionModel.findByPk(optionDto.id, { transaction });

              // If the option doesn't exist, create it
              if (!option) {
                option = await this.optionModel.create(
                  {
                    question_id: question.id,
                    text: optionDto.text,
                    is_correct: optionDto.isCorrect || false,
                  },
                  { transaction }
                );
              } else {
                if (optionDto.text) {
                  option.text = optionDto.text;
                }

                // Handle correct option updates
                if (optionDto.isCorrect) {
                  // Check if there's an existing correct option
                  const currentCorrectOption = await this.optionModel.findOne({
                    where: { question_id: question.id, is_correct: true },
                    transaction,
                  });

                  if (currentCorrectOption && currentCorrectOption.id !== optionDto.id) {
                    // Set the previous correct option to is_correct = false
                    await currentCorrectOption.update({ is_correct: false }, { transaction });
                  }

                  option.is_correct = true;
                } else {
                  option.is_correct = false;
                }
              }

              await option.save({ transaction });
            }
          }
        }
      }

      // Update totalScore in the quiz
      quiz.total_score = totalScore;
      await quiz.save({ transaction });

      await transaction.commit();
      return {
        statusCode: 200,
        messag: "quiz edited successfully"
      }
    } catch (error) {
      await transaction.rollback();
      throw new HttpException(error.message || 'Failed to edit quiz', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async findAllQuizByLevel(req: any, page: number = 1, limit: number = 10) {
    try {
      if (req.user.level_id == null) {
        throw new Error("Level is not assigned to user");
      }

      const offset = (page - 1) * limit;

      const { rows: data, count: total } = await Quiz.findAndCountAll({
        include: [
          {
            required: true,
            model: Subject
          },
          {
            required: true,
            model: TeacherProfile,
            where: {
              level_id: {
                [Op.eq]: req.user.level_id
              },
              school_id: {
                [Op.eq]: req.user.school_id
              }
            }
          },
          {
            model: QuizAttempt,
            required: false,
            where: {
              student_id: {
                [Op.eq]: req.user.sub
              }
            }
          }
        ],
        order: [
          ["id", "DESC"]
        ],
        limit,
        offset
      });

      const totalPages = Math.ceil(total / limit);

      return {
        statusCode: 200,
        data,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch quizzes by level',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAll(req: any, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const { rows: data, count: total } = await this.quizModel.findAndCountAll({
        include: [
          { model: Level, attributes: ['id', 'level'] },
          { model: Subject, attributes: ['id', 'title'] },
          // {
          //   model: Question, include: [{
          //     model: Option,
          //     attributes: ["id", "text"]
          //   }]
          // },
        ],
        where: {
          teacher_id: {
            [Op.eq]: req.user.sub
          }
        },
        limit,
        offset
      });

      const totalPages = Math.ceil(total / limit);

      return {
        statusCode: 200,
        data,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch quizzes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteQuiz(id: number) {
    try {
      const quiz = await this.quizModel.destroy({
        where: {
          id: {
            [Op.eq]: id
          }
        }
      });

      return {
        statusCode: 200,
        message: "Quiz deleted Successfully"
      }
    } catch (error) {
      throw new HttpException(error.message || 'Failed to delete quiz', HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  async findOne(quiz_id: number, req: any) {
    try {
      if (req.user.role === Role.USER) {
        const quizAttemptExist = await QuizAttempt.findOne({
          where: {
            student_id: req.user.sub,
            quiz_id: quiz_id,
          },
        });

        if (quizAttemptExist && quizAttemptExist.submitted) {
          throw new ForbiddenException('Quiz has already been submitted.');
        }
      }

      const quiz = await this.quizModel.findByPk(quiz_id, {
        include: [
          { model: Level, attributes: ['id', 'level'] },
          { model: Subject, attributes: ['id', 'title'] },
          { model: Question, include: [Option] },
        ],
      });

      if (!quiz) {
        throw new NotFoundException(`Quiz with ID ${quiz_id} not found.`);
      }

      return {
        statusCode: 200,
        data: quiz
      }
    } catch (error) {
      // Re-throw the error if it's already an HTTP exception
      if (error instanceof HttpException) {
        throw error;
      }
      // Wrap other errors in a generic InternalServerErrorException
      throw new HttpException(error.message || 'Unable to get quiz.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}