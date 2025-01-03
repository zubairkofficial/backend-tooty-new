// src/services/Quiz.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
import { Question } from 'src/question/entities/question.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { Option } from 'src/option/entities/option.entity';
import { QuizType } from 'src/utils/quizType.enum';

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
    });

    // Add questions and options
    for (const questionDto of questions) {
      const question = await this.questionModel.create({
        text: questionDto.text,
        questionType: questionDto.questionType,
        quizId: quiz.id,
      });

      for (const optionDto of questionDto.options) {
        await this.optionModel.create({
          text: optionDto.text,
          isCorrect: optionDto.isCorrect,
          questionId: question.id,
        });
      }
    }

    return quiz;
  }

  async findAll(): Promise<Quiz[]> {
    const data = await this.quizModel.findAll({
      // include: [
      //   { model: Level, attributes: ['id', 'name'] },
      //   { model: Subject, attributes: ['id', 'name'] },
      //   { model: Question, include: [Option] },
      // ],
      raw: true
    });

    return data
  }

  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizModel.findByPk(id, {
      include: [
        { model: Level, attributes: ['id', 'name'] },
        { model: Subject, attributes: ['id', 'name'] },
        { model: Question, include: [Option] },
      ],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }
}