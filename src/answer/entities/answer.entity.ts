// src/answer/entities/answer.entity.ts
import { Table, Model, Column, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { Question } from 'src/question/entities/question.entity';
import { Option } from 'src/option/entities/option.entity';

@Table({ tableName: 'answers' })
export class Answer extends Model<Answer> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => QuizAttempt)
  @Column({ type: DataType.INTEGER, allowNull: false })
  attempt_id: number;

  @ForeignKey(() => Question)
  @Column({ type: DataType.INTEGER, allowNull: false })
  question_id: number;

  @ForeignKey(() => Option)
  @Column({ type: DataType.INTEGER, allowNull: true }) // Nullable for Question-Answer type
  option_id: number;

  @Column({ type: DataType.TEXT, allowNull: true }) // Nullable for Multiple Choice type
  text_answer: string;

  @Default(0)
  @Column({ type: DataType.FLOAT }) // Nullable for Multiple Choice type
  obtained_score: number;

  // src/answer/entities/answer.entity.ts
  @Column({ type: DataType.BOOLEAN, allowNull: true }) // Allow null for isCorrect
  is_correct: boolean;

  @BelongsTo(() => QuizAttempt, { onDelete: 'CASCADE' })
  attempt: QuizAttempt;

  @BelongsTo(() => Question)
  question: Question;

  @BelongsTo(() => Option)
  selected_option: Option;
}