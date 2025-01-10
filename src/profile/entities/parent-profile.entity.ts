import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';
import { StudentProfile } from './student-profile.entity';


@Table({
    tableName: 'parent-profile',
    timestamps: true,
    paranoid: true
})
export class ParentProfile extends Model {
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
    school_id: number;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user!: User


    @BelongsTo(() => School, { onDelete: 'CASCADE' })
    school!: School

    @HasMany(() => StudentProfile)
    children!: StudentProfile[]

}
