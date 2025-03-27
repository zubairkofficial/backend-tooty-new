import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { CreateSubmitQuizAttemptDto, SubmitQuizAttemptDto } from './dto/quiz-attempt.dto';
import { Question } from 'src/question/entities/question.entity';
import { Option } from 'src/option/entities/option.entity';
import { QuizType } from 'src/utils/quizType.enum';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Sequelize } from 'sequelize-typescript';
import { ChatOpenAI } from '@langchain/openai';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { Model, Op } from 'sequelize';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { School } from 'src/school/entities/school.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';

const outputSchema = z.object({
  question_obtained_marks: z.number(),
});

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectModel(QuizAttempt)
    private readonly quizAttemptModel: typeof QuizAttempt,
    @InjectModel(Answer)
    private readonly answerModel: typeof Answer,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Option)
    private readonly optionModel: typeof Option,
    @InjectModel(Quiz)
    private readonly quizModel: typeof Quiz,
    private readonly sequelize: Sequelize,
  ) { }


  async getQuizAttemptsByStudent(req: any, page: number, limit: number) {

    try {

      const offset = (page - 1) * limit



      const { rows: data, count: total } = await QuizAttempt.findAndCountAll({
        where: {
          student_id: {
            [Op.eq]: req.user.sub
          },
          marked: {
            [Op.eq]: true
          }
        },

        include: [

          {
            model: Quiz,
            as: 'quiz',
          },
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
      }

    } catch (error) {
      throw new HttpException(
        error.message || "Error fetching quiz attempts by student and subject.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async getQuizAttemptsByStudentSubject(params: any, req: any, page: number = 1, limit: number = 10) {
    if (!params.student_id || !params.subject_id) {
      throw new Error("subject_id and student_id must be defined in params: /:subject_id/:student_id");
    }

    try {
      const teacher_has_subject = await Subject.findByPk(Number(params.subject_id), {
        include: [{
          required: true,
          model: TeacherProfile,
          where: {
            id: {
              [Op.eq]: req.user.sub
            }
          }
        }]
      });
      console.log("teacher_has_subject", teacher_has_subject);
      if (!teacher_has_subject) {
        throw new Error("Subject is UnAvailable to teacher");
      }

      // Calculate the offset based on the page and limit
      const offset = (page - 1) * limit;

      // Use findAndCountAll to retrieve paginated data along with the total count
      const { rows: data, count: total } = await QuizAttempt.findAndCountAll({
        where: {
          student_id: {
            [Op.eq]: Number(params.student_id)
          }
        },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Quiz,
            as: 'quiz',
            where: {
              subject_id: {
                [Op.eq]: Number(params.subject_id)
              },
              teacher_id: {
                [Op.eq]: req.user.sub
              }
            },
          },
        ],
        limit,   // Number of records to fetch
        offset   // Starting point for records
      });

      // Calculate total number of pages
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
        error.message || "Error fetching quiz attempts by student and subject.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  async getQuizAttemptDetailById(params: any, req: any) {
    const attemptId = Number(params.attempt_id);

    if (isNaN(attemptId)) {
      console.error('Invalid attempt_id:', params.attempt_id);
      throw new Error("Invalid attempt_id provided");
    }
    try {
      const quiz = await QuizAttempt.findOne({
        where: {
          id: {
            [Op.eq]: attemptId
          }
        },

        include: [
          {
            required: true,
            model: Quiz,
            as: 'quiz',
            where: {
              teacher_id: {
                [Op.eq]: req.user.sub
              }
            },
            include: [{
              model: Question,
              include: [{
                model: Option
              }]
            }]

          },

          {
            required: true,
            model: Answer,
            as: 'answers',
            include: [
              {
                required: false,
                model: Option,
                as: "selected_option"
              },
              {

                model: Question,
                include: [{
                  required: false,
                  model: Option
                }]
              }]
          },
        ],
      });

      if (quiz === null || quiz === undefined) {
        throw new Error("No quiz Attempt found for this id")
      }



      return {
        statusCode: HttpStatus.OK,
        data: quiz,
      };
    } catch (error) {
      console.error('Error in getQuizAttemptDetailByQuizId:', error);
      throw new HttpException(
        error.message || "Error fetching quiz attempt details.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }

  async createSubmitQuizAttempt(student_id: number, createSubmitQuizAttempt: CreateSubmitQuizAttemptDto) {
    const { quiz_id } = createSubmitQuizAttempt;

    try {

      const quiz = await this.quizModel.findByPk(quiz_id);

      if (!quiz) {
        throw new HttpException(`Quiz with ID ${quiz_id} not found`, HttpStatus.NOT_FOUND);
      }

      if (quiz?.start_time !== null && quiz?.end_time !== null) {
        console.log("i am coming here")
        // Parse the incoming dates as UTC
        const quizStartTime = new Date(`${quiz?.start_time}T00:00:00Z`);
        const quizEndTime = new Date(`${quiz?.end_time}T00:00:00Z`);

        // Get the current UTC date (without time)
        const now = new Date();
        const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Check if the quiz start time is in the past (compared to UTC date only)
        if (quizStartTime < currentUTCDate) {
          throw new BadRequestException("quiz has not started yet");
        }

        // Check if start_time is greater than or equal to end_time
        if (currentUTCDate >= quizEndTime) {
          throw new BadRequestException('The Quiz has ended');
        }
      }

      let quiz_attempt = await this.quizAttemptModel.findOne({
        where: {
          quiz_id: {
            [Op.eq]: quiz_id,
          },
          student_id: {
            [Op.eq]: student_id,
          },
        },
      });

      if (quiz_attempt && quiz_attempt.submitted) {
        throw new HttpException('Quiz has already been submitted', HttpStatus.BAD_REQUEST);
      }

      if (!quiz_attempt) {
        quiz_attempt = await this.quizAttemptModel.create({
          quiz_id,
          student_id,
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Success starting the quiz',
      };
    } catch (error) {
      console.error('Error creating quiz submission:', error);
      throw new HttpException(
        error.message || 'Error creating quiz submission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitQuizAttempt(student_id: number, submitQuizAttemptDto: SubmitQuizAttemptDto) {
    const { quiz_id, answers } = submitQuizAttemptDto;
    const transaction = await this.sequelize.transaction();

    try {
      const quiz = await this.quizModel.findByPk(quiz_id, {
        include: [
          {
            model: Subject,
            attributes: ['title'],
            include: [
              {
                model: Bot,
                attributes: ['ai_model'],
              },
            ],
          },
        ],
        transaction,
      });

      if (!quiz) {
        throw new HttpException(`Quiz with ID ${quiz_id} not found`, HttpStatus.NOT_FOUND);
      }

      if (quiz?.start_time !== null && quiz?.end_time !== null) {
        // Parse the incoming dates as UTC
        const quizStartTime = new Date(`${quiz?.start_time}T00:00:00Z`);
        const quizEndTime = new Date(`${quiz?.end_time}T00:00:00Z`);

        // Get the current UTC date (without time)
        const now = new Date();
        const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Check if the quiz start time is in the past (compared to UTC date only)
        if (quizStartTime < currentUTCDate) {
          throw new BadRequestException("quiz has not started yet");
        }

        // Check if start_time is greater than or equal to end_time
        if (currentUTCDate >= quizEndTime) {
          throw new BadRequestException('The Quiz has ended');
        }
      }

      let quizAttempt = await this.quizAttemptModel.findOne({
        where: {
          quiz_id: {
            [Op.eq]: quiz.id,
          },
          student_id: {
            [Op.eq]: student_id,
          },
        },
      });

      if (!quizAttempt) {
        quizAttempt = await this.quizAttemptModel.create(
          {
            quiz_id,
            student_id,
          },
          { transaction },
        );
      }

      if (quizAttempt && quizAttempt.submitted) {
        throw new HttpException('Quiz has already been submitted', HttpStatus.BAD_REQUEST);
      }

      let totalScore = 0;

      for (const answer of answers) {
        const question = await this.questionModel.findByPk(answer.question_id, { transaction });
        if (!question) {
          throw new HttpException(`Question with ID ${answer.question_id} not found`, HttpStatus.NOT_FOUND);
        }

        if (quiz.quiz_type === QuizType.MCQS) {
          const selectedOption = await this.optionModel.findByPk(answer.option_id, { transaction });
          const isCorrect = selectedOption?.is_correct || false;

          if (isCorrect) {
            totalScore += question.score;
          }

          await this.answerModel.create(
            {
              attempt_id: quizAttempt.id,
              question_id: answer.question_id,
              option_id: answer.option_id,
              is_correct: isCorrect,
              obtained_score: isCorrect ? 1 : 0,
            },
            { transaction },
          );
        } else if (quiz.quiz_type === QuizType.QA) {
          const obtainedMarks = await this.evaluateAnswerWithOpenAI(
            question.text,
            question.score,
            answer.text_answer,
            quiz.subject.title,

            quiz?.subject?.bot?.ai_model || "gpt-3.5-turbo",
          );

          totalScore += obtainedMarks;

          await this.answerModel.create(
            {
              attempt_id: quizAttempt.id,
              question_id: answer.question_id,
              text_answer: answer.text_answer,
              obtained_score: obtainedMarks,
            },
            { transaction },
          );
        }
      }

      quizAttempt.obtained_score = totalScore;
      quizAttempt.marked = true;
      quizAttempt.submitted = true;
      await quizAttempt.save({ transaction });

      await transaction.commit();

      return quizAttempt;
    } catch (error) {
      await transaction.rollback();
      console.error('Error submitting quiz:', error);
      throw new HttpException(
        error.message || 'Failed to submit quiz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async evaluateAnswerWithOpenAI(
    question: string,
    questionTotalScore: number,
    answer: string,
    subjectName: string,
    bot: string,
  ): Promise<number> {
    try {
      const api = await SuperAdminProfile.findOne({
        attributes: ['openai'],
      });

      if (!api) {
        throw new HttpException('Unable to find API key', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const api_key = api?.openai;

      if (api_key !== '') {
        const llm = new ChatOpenAI({
          model: bot,
          temperature: 0,
          maxTokens: 1000,
          timeout: 15000,
          maxRetries: 2,
          apiKey: api_key,
        });

        const template = `
          You are an intelligent evaluator. Your task is to evaluate a student's answer for a given question based on the subject knowledge. Focus on the correctness of the concepts. Grammar is irrelevant unless it affects the meaning. 
          - Check for the concepts explained in student's answer, give number according to that
          **Expected Output Json Format**
          {{
            "question_obtained_marks": number
          }}

          Rules:
            - The question_obtained_marks must be a positive integer and equal to or less than QuestionTotalMarks: {questionTotalScore}.
            - Use subjectName: {subjectName} to apply domain-specific knowledge for evaluation.

          Input:
            - Question: {question}
            - Question Total Score: {questionTotalScore}
            - Student's Answer: {answer}
            - Subject Name: {subjectName}

          Now evaluate the answer strictly as per the rules.
        `;

        const AnswerGenrateTemplate = ChatPromptTemplate.fromMessages([['system', template]]);
        const promptValue = await AnswerGenrateTemplate.invoke({
          question: question,
          questionTotalScore: questionTotalScore,
          answer: answer,
          subjectName: subjectName,
        });

        const llm_structured = llm.withStructuredOutput(outputSchema);
        const result = await llm_structured.invoke(promptValue);
        return result.question_obtained_marks;
      } else {
        throw new HttpException('OpenAI API key is missing', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      throw new HttpException(error.message || 'Failed to evaluate answer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}