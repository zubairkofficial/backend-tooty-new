import {
  Column,
  DataType,
  Default,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { RefreshToken } from './refreshToken.entity';
import { Role } from 'src/utils/roles.enum';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { ParentProfile } from 'src/profile/entities/parent-profile.entity';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';
import { Puzzle } from 'src/puzzle/entity/puzzle.entity';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true
})
export class User extends Model {
  @PrimaryKey
  @Column({
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  id: number;

  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true
  })
  email: string;

  @Column({
    type: DataType.STRING,

  })
  user_image_url: string;

  @Column({
    type: DataType.STRING,
  })
  contact: string;

  @Column({
    type: DataType.STRING,
  })
  password: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Role), // You can provide the enum values here
  })
  role: Role;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  isVerified: boolean;


  @HasOne(() => RefreshToken, { onDelete: 'CASCADE' })
  refresh_token!: RefreshToken;

  @HasOne(() => StudentProfile, { onDelete: 'CASCADE' })
  student_profile: StudentProfile;

  @HasOne(() => ParentProfile, { onDelete: 'CASCADE' })
  parent_profile: ParentProfile;

  @HasOne(() => TeacherProfile, { onDelete: 'CASCADE' })
  teacher_profile: TeacherProfile

  @HasOne(() => AdminProfile, { onDelete: 'CASCADE' })
  admin_profile: AdminProfile

  @HasOne(() => SuperAdminProfile)
  super_admin_profile: SuperAdminProfile

  @HasOne(() => SuperIntendentProfile, { onDelete: 'CASCADE' })
  super_intendent_profile: SuperIntendentProfile

  @HasMany(() => Chat, { onDelete: 'CASCADE' })
  chats!: Chat[]

  @HasMany(() => Puzzle)
  puzzles!: Puzzle[]

}
