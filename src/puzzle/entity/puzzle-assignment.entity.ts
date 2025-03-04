import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { Puzzle } from "./puzzle.entity";
import { TeacherProfile } from "src/profile/entities/teacher-profile.entity";
import { PuzzleAttempt } from "./puzzle-attempts.entity";

@Table({
    tableName: 'puzzle-assignments',
    timestamps: true,
    paranoid: true
})
export class PuzzleAssignment extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @ForeignKey(() => Puzzle)
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
       
    })
    puzzle_id: number;

    @ForeignKey(() => TeacherProfile)
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
    
    })
    teacher_id: number;

    @BelongsTo(() => Puzzle, { onDelete: "CASCADE" })
    puzzle!: Puzzle

    @BelongsTo(() => TeacherProfile)
    teacher!: TeacherProfile

    @HasMany(() => PuzzleAttempt, { onDelete: "CASCADE" })
    solve_attempts!: PuzzleAttempt[]
}