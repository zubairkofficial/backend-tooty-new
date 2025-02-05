import {
    BeforeUpdate,
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
import { Level } from 'src/level/entity/level.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { School } from 'src/school/entities/school.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { User } from 'src/user/entities/user.entity';
import { JoinTeacherSubjectLevel } from './join-teacher-subject-level.entity';
import { Op } from 'sequelize';


@Table({
    tableName: 'teacher-profile',
    timestamps: true,
    paranoid: true
})
export class TeacherProfile extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
    })
    id: number; //it must be equal to the id in User table

    @Column({
        type: DataType.STRING
    })
    title: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER
    })
    user_id: number;

    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER,
    })
    school_id: number;

    @ForeignKey(() => Level)
    @Column({
        type: DataType.INTEGER
    })
    level_id: number;

    @BelongsTo(() => Level)
    level!: Level

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user!: User

    @BelongsTo(() => School, { onDelete: 'CASCADE' })
    school!: School

    @HasMany(() => Quiz, { onDelete: 'CASCADE' })
    quizes!: Quiz[]

    @BelongsToMany(() => Subject, () => JoinTeacherSubjectLevel)
    subjects!: Subject[]

    // @BelongsToMany(() => Level, () => JoinTeacherSubjectLevel)
    // level_join_table!: Level[]

    @BeforeUpdate
    static async removeSubjectOnLevelChange(instance: TeacherProfile) {
        if (instance.changed("level_id")) {
            await JoinTeacherSubjectLevel.destroy({
                where: {
                    teacher_id: {
                        [Op.eq]: instance.id
                    }
                }
            })
        }
    }
}
