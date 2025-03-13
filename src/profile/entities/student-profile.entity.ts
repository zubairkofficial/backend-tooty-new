import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { Level } from 'src/level/entity/level.entity';
import { QuizAttempt } from 'src/quiz-attempt/entities/quiz-attempt.entity';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';
import { ParentProfile } from './parent-profile.entity';
import { PuzzleAttempt } from 'src/puzzle/entity/puzzle-attempts.entity';

@Table({
    tableName: 'student-profile',
    timestamps: true,
    paranoid: true
})
export class StudentProfile extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
    })
    id: number;

    @Unique
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    user_roll_no: string;

    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER,
    })
    school_id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER
    })
    user_id: number;

    @ForeignKey(() => Level)
    @Column({
        type: DataType.INTEGER,
    })
    level_id: number;

    @ForeignKey(() => ParentProfile)
    @Column({
        type: DataType.INTEGER,
    })
    parent_id: number;

    @BelongsTo(() => ParentProfile)
    parent!: ParentProfile;

    @BelongsTo(() => School, { onDelete: 'CASCADE' })
    school!: School

    @BelongsTo(() => Level)
    level!: Level

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user!: User

    @HasMany(() => QuizAttempt, { onDelete: 'CASCADE' })
    attempted_quizes!: QuizAttempt[]

    @HasMany(() => PuzzleAttempt, { onDelete: 'CASCADE' })
    solved_puzzles!: PuzzleAttempt[]
}
