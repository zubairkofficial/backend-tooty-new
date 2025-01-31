import {
    Column,
    DataType,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { SuperIntendentProfile } from 'src/profile/entities/super-intendent-profile.entity';

@Table({
    tableName: 'districts',
    paranoid: true
})
export class District extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true
    })
    id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name: string

    @HasOne(() => SuperIntendentProfile)
    super_intendent!: SuperIntendentProfile
}
