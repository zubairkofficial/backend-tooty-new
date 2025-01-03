// src/models/Quiz.model.js
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Level } from 'src/level/entity/level.entity';
import { Question } from 'src/question/entities/question.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { QuizType } from 'src/utils/quizType.enum';

@Table({ tableName: 'quizzes' })
export class Quiz extends Model<Quiz> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, allowNull: false })
  description: string;

  @Column({ type: DataType.ENUM(QuizType.MCQS, QuizType.QA) , allowNull: false })
  quiz_type: string;

  @Column({ type: DataType.DATE, allowNull: false })
  start_time: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  end_time: Date;

  @Column({ type: DataType.INTEGER, allowNull: false })
  duration: number; // Duration in minutes

  @ForeignKey(() => Level)
  @Column({ type: DataType.INTEGER, allowNull: false })
  level_id: number;

  @BelongsTo(() => Level)
  level: Level;

  @ForeignKey(() => Subject)
  @Column({ type: DataType.INTEGER, allowNull: false })
  subject_id: number;

  @BelongsTo(() => Subject)
  subject: Subject;

  @HasMany(() => Question)
  questions: Question[];
}