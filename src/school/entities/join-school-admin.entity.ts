import { Column, DataType, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { AdminProfile } from 'src/profile/entities/admin-profile.entity';
import { School } from './school.entity';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';

@Table({
  tableName: 'join-school-admins',
  timestamps: true,
})
export class JoinSchoolAdmin extends Model {
  @PrimaryKey
  @Column({
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  id: number;

  @Unique
  @ForeignKey(() => AdminProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  admin_id: number;

  @ForeignKey(() => School)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  school_id: number;
}