import { BelongsTo, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { File } from 'src/context_data/entities/file.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Bot } from 'src/bot/entities/bot.entity';
import { Level } from 'src/level/entity/level.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';

@Table({
  tableName: 'schools',
  timestamps: true,
  paranoid: true
})
export class School extends Model {
  @PrimaryKey
  @Column({
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @HasMany(() => StudentProfile, { onDelete: 'CASCADE' })
  students!: StudentProfile[]

  @HasMany(() => ParentProfile,{ onDelete: 'CASCADE' })
  parents!: ParentProfile[]

  @HasMany(() => TeacherProfile, { onDelete: 'CASCADE' })
  teachers!: TeacherProfile[]

  @HasMany(() => AdminProfile)
  admins!: AdminProfile[]

  @HasMany(() => File, { onDelete: 'CASCADE' })
  files!: File[]

  @HasMany(() => Subject, { onDelete: 'CASCADE' })
  subjects!: Subject[]

  @HasMany(() => Bot, { onDelete: 'CASCADE' })
  bots!: Bot[]

  @HasMany(() => Level, { onDelete: 'CASCADE' })
  level!: Level[]
}