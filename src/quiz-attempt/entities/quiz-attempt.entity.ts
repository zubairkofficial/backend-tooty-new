import { Table, Model, Column, DataType, ForeignKey, BelongsTo, HasMany, Default, Unique } from 'sequelize-typescript';
import { Answer } from 'src/answer/entities/answer.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';

@Table({ tableName: 'quiz_attempts' }) // Define the table name
export class QuizAttempt extends Model<QuizAttempt> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Unique("quiz-attempt-unique")
  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quiz_id: number;

  @Unique("quiz-attempt-unique")
  @ForeignKey(() => StudentProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  student_id: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  submitted: boolean

  @Default(0)
  @Column({
    type: DataType.INTEGER,
  })
  quiz_time_consumed: number

  @Default(0)
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  obtained_score: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  marked: boolean;

  @BelongsTo(() => Quiz)
  quiz: Quiz;

  @BelongsTo(() => StudentProfile, { onDelete: 'CASCADE' })
  student: StudentProfile;

  @HasMany(() => Answer, { onDelete: 'CASCADE' })
  answers!: Answer[]
}