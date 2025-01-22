// src/services/Quiz.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async create(createQuizDto: CreateQuizDto, req: any): Promise<Quiz> {
    const { title, description, quiz_type, start_time, end_time, duration, subject_id, questions } = createQuizDto;

    // Validate quiz timing
    if (start_time >= end_time) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check if level and subject exist
    const level = await this.levelModel.findByPk(req.user.level_id);
    if (!level) {
      throw new NotFoundException(`Level with ID ${req.user.level_id} not found`);
    }

    const subject = await this.subjectModel.findByPk(subject_id);
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
      start_time,
      end_time,
      duration,
      level_id: req.user.level_id,
      subject_id,
      teacher_id: req.user.sub,
    });

    // Add questions and options
    for (const questionDto of questions) {
      // Create question with score from the DTO
      const question = await this.questionModel.create({
        text: questionDto.text,
        question_type: questionDto.questionType === "multiple-choice" ? QuizType.MCQS : QuizType.QA,
        quiz_id: quiz.id,
        score: questionDto.score, // Add the score for the question
      });

      totalScore += questionDto.score;
      question.score = questionDto.score
      // Add the question's score to the total score

      if (quiz.quiz_type === QuizType.MCQS) {
        // Add options for multiple-choice questions
        for (const optionDto of questionDto.options) {
          await this.optionModel.create({
            text: optionDto.text,
            is_correct: optionDto.isCorrect,
            question_id: question.id,
          });
        }
      }
    }

    // Update quiz total score
    quiz.total_score = totalScore;
    await quiz.save();

    return quiz;
  }


  async editQuiz(editQuizDto: EditQuizDto, req: any): Promise<Quiz> {
    const transaction = await this.sequelize.transaction();

    try {
      let totalScore = 0;
      const quiz = await this.quizModel.findByPk(editQuizDto.id, { transaction });
      if (!quiz) {
        throw new NotFoundException(`Quiz with ID ${editQuizDto.id} not found`);
      }

      // Check if the quiz has already started
      const currentDate = new Date();
      if (currentDate >= quiz.start_time) {
        throw new BadRequestException('Quiz cannot be edited after it has started');
      }

      const { title, description, start_time, end_time, duration, subject_id, questions } = editQuizDto;

      // Update quiz fields if provided
      if (title) quiz.title = title;
      if (description) quiz.description = description;
      if (start_time) quiz.start_time = start_time;
      if (end_time) quiz.end_time = end_time;
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
      return quiz;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }





  async findAllQuizByLevel(req): Promise<Quiz[]> {
    if (req.user.level_id == null) {
      throw new Error("Level is not assigned to user")
      return
    }
    const data = await this.quizModel.findAll({
      include: [{
        model: Subject
      }],
      where: {
        level_id: {
          [Op.eq]: req.user.level_id
        }
      },
    });

    return data
  }

  async findAll(req: any): Promise<Quiz[]> {
    const data = await this.quizModel.findAll({
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

    });

    return data
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
      throw new Error("Failed to delete quiz")
    }

  }

  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(id, {
      include: [
        { model: Level, attributes: ['id', 'level'] },
        { model: Subject, attributes: ['id', 'title'] },
        { model: Question, include: [Option] },
      ],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }
}