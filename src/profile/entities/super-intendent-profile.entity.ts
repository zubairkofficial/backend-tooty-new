import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { District } from 'src/district/entity/district.entity';
import { JoinSchoolAdmin } from 'src/school/entities/join-school-admin.entity';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';


@Table({
    tableName: 'super-intendent-profiles',
    timestamps: true,
    paranoid: true
})
export class SuperIntendentProfile extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
    })
    id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER
    })
    user_id: number;

    @ForeignKey(() => District)
    @Column({
        type: DataType.INTEGER
    })
    district_id: number;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user!: User

    @BelongsTo(() => District)
    district!: District

    @HasMany(() => School)
    schools!: School[]
}
