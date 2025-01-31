import {
    Column,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { Bot } from 'src/bot/entities/bot.entity';
import { StudentProfile } from 'src/profile/entities/student-profile.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
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

    @Unique('unique_level')
    @Column({
        type: DataType.STRING,
    })
    level: string;

   

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

}
