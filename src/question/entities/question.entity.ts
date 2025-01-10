// src/question/entities/question.entity.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default } from 'sequelize-typescript';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Option } from 'src/option/entities/option.entity';
import { QuizType } from 'src/utils/quizType.enum';
import { Answer } from 'src/answer/entities/answer.entity';


@Table({ tableName: 'questions' })
export class Question extends Model<Question> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  text: string;

  @Column({
    type: DataType.ENUM(QuizType.MCQS, QuizType.QA),
    allowNull: false,
  })
  question_type: QuizType;

  @Column({ type: DataType.STRING, allowNull: true }) // Nullable for Multiple Choice questions
  correct_answer: string; // Stores the correct answer for Question-Answer type questions


  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: true })
  score: number; // Duration in minutes

  @ForeignKey(() => Quiz)
  @Column({ type: DataType.INTEGER, allowNull: false })
  quiz_id: number;

  @BelongsTo(() => Quiz, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @HasMany(() => Option, { onDelete: 'CASCADE' })
  options: Option[];

}