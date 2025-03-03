import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table, Unique } from "sequelize-typescript";
import { Puzzle } from "./puzzle.entity";
import { StudentProfile } from "src/profile/entities/student-profile.entity";



@Table({
    tableName: 'puzzle-attempts',
    timestamps: true,
    paranoid: true
})
export class PuzzleAttempt extends Model {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    image_url: string;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    marked: boolean;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    bot_remarks: string;

    @Default(0)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    obtained_score: number;

    @Unique("student-puzzle")
    @ForeignKey(() => Puzzle)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    puzzle_id: number;

    @BelongsTo(() => Puzzle, { onDelete: "CASCADE" })
    puzzle!: Puzzle

    @Unique("student-puzzle")
    @ForeignKey(() => StudentProfile)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    student_id: number;

    @BelongsTo(() => StudentProfile)
    student!: StudentProfile


}