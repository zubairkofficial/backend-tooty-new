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
    Unique,
} from 'sequelize-typescript';
import { Bot } from 'src/bot/entities/bot.entity';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { School } from 'src/school/entities/school.entity';
import { Subject } from 'src/subject/entity/subject.entity';


@Table({
    tableName: 'levels',
    timestamps: true,
    paranoid: true
})
export class Level extends Model {
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
    level: string;

    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER
    })
    school_id: number

    @Column({
        type: DataType.TEXT,
    })
    description: string;

    @HasMany(() => StudentProfile)
    students!: StudentProfile

    @HasMany(() => TeacherProfile)
    teachers!: TeacherProfile

    @HasMany(() => Subject)
    subjects!: Subject

    @HasMany(() => Bot)
    bots!: Bot[]


    @BelongsToMany(() => TeacherProfile, () => JoinTeacherSubjectLevel)
    teacher_join_table!: TeacherProfile[]

    @BelongsToMany(() => Subject, () => JoinTeacherSubjectLevel)
    subject_join_table!: Subject[]


    @BelongsTo(() => School, { onDelete: 'CASCADE' })
    school!: School

}
