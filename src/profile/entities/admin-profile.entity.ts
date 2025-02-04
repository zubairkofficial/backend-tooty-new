import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { District } from 'src/district/entity/district.entity';
import { JoinSchoolAdmin } from 'src/school/entities/join-school-admin.entity';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';


@Table({
    tableName: 'admin-profile',
    timestamps: true,
    paranoid: true
})
export class AdminProfile extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
    })
    id: number;

    @Unique
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER
    })
    user_id: number;


    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER
    })
    school_id: number

    @ForeignKey(() => District)
    @Column({
        type: DataType.INTEGER
    })
    district_id: number

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user!: User

    @BelongsToMany(() => School, () => JoinSchoolAdmin)
    schools!: School[]
}
