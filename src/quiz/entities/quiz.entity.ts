// src/models/Quiz.model.js
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default } from 'sequelize-typescript';
import { Level } from 'src/level/entity/level.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Question } from 'src/question/entities/question.entity';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
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

  @Column({ type: DataType.ENUM(QuizType.MCQS, QuizType.QA), allowNull: false })
  quiz_type: string;

  @Default(null)
  @Column({ type: DataType.DATEONLY, allowNull: true })
  start_time: Date;

  @Default(null)
  @Column({ type: DataType.DATEONLY, allowNull: true })
  end_time: Date;

  @Column({ type: DataType.INTEGER, allowNull: false })
  duration: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: true })
  total_score: number;

  @ForeignKey(() => Level)
  @Column({ type: DataType.INTEGER, allowNull: false })
  level_id: number;

  @ForeignKey(() => TeacherProfile)
  @Column({ type: DataType.INTEGER, allowNull: false })
  teacher_id: number;

  @ForeignKey(() => Subject)
  @Column({ type: DataType.INTEGER, allowNull: false })
  subject_id: number;

  @BelongsTo(() => TeacherProfile, { onDelete: 'CASCADE' })
  teacher!: TeacherProfile

  @BelongsTo(() => Level)
  level!: Level;

  @BelongsTo(() => Subject, { onDelete: "CASCADE" })
  subject!: Subject;

  @HasMany(() => Question, { onDelete: 'CASCADE' })
  questions: Question[];

  @HasMany(() => QuizAttempt, { onDelete: 'CASCADE' })
  quiz_attempts: QuizAttempt[]
}