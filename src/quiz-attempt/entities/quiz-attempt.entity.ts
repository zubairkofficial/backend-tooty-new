import { Table, Model, Column, DataType, ForeignKey, BelongsTo, HasMany, Default } from 'sequelize-typescript';
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

  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quiz_id: number;

  @ForeignKey(() => StudentProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  student_id: number;

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