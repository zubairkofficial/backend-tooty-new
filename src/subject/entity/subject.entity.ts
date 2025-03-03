import {
    BelongsTo,
    BelongsToMany,
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
import { Bot } from 'src/bot/entities/bot.entity';
import { File } from 'src/context_data/entities/file.entity';
import { Level } from 'src/level/entity/level.entity';
import { JoinTeacherSubjectLevel } from 'src/profile/entities/join-teacher-subject-level.entity';
import { TeacherProfile } from 'src/profile/entities/teacher-profile.entity';
import { Puzzle } from 'src/puzzle/entity/puzzle.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';


@Table({
    tableName: 'subjects',
    timestamps: true,
    paranoid: true
})
export class Subject extends Model {
    @PrimaryKey
    @Column({
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    id: number;

    @Unique('unique_subject')
    @Column({
        type: DataType.STRING
    })
    title: string;

    @Column({
        type: DataType.STRING
    })
    display_title: string;

    @Column({
        type: DataType.TEXT
    })
    description: string;

    @ForeignKey(() => Level)
    @Unique('unique_subject')
    @Column({
        type: DataType.INTEGER
    })
    level_id: number;

    @HasMany(() => File)
    files!: File[];

    @HasMany(() => Quiz, { onDelete: "CASCADE" })
    quizez!: Quiz[];

    @HasMany(() => Puzzle, { onDelete: "CASCADE" })
    puzzles!: Puzzle[];


    @BelongsTo(() => Level, { as: 'level' })
    level!: Level;

    @HasOne(() => Bot)
    bot!: Bot;

    @BelongsToMany(() => TeacherProfile, () => JoinTeacherSubjectLevel)
    teachers!: TeacherProfile[];

}