import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';
import { JoinSchoolAdmin } from './join-school-admin.entity';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { Notification } from 'src/notification/entity/notification.entity';

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

  @Unique
  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @ForeignKey(() => SuperIntendentProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by_id: number;


  @HasMany(() => StudentProfile, { onDelete: 'CASCADE' })
  students!: StudentProfile[]

  @HasMany(() => ParentProfile, { onDelete: 'CASCADE' })
  parents!: ParentProfile[]

  @HasMany(() => TeacherProfile, { onDelete: 'CASCADE' })
  teachers!: TeacherProfile[]

  @BelongsToMany(() => AdminProfile, () => JoinSchoolAdmin)
  admins!: AdminProfile[]

  @BelongsTo(() => SuperIntendentProfile)
  creator!: SuperIntendentProfile

  @HasMany(() => Notification)
  notifications!: Notification[]
}
