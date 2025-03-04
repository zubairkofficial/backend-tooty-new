import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { Level } from "src/level/entity/level.entity";
import { Subject } from "src/subject/entity/subject.entity";
import { PuzzleAttempt } from "./puzzle-attempts.entity";
import { PuzzleAssignment } from "./puzzle-assignment.entity";


@Table({
    tableName: 'puzzles',
    timestamps: true,
    paranoid: true
})
export class Puzzle extends Model {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    image_url: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    description: string;

    @Default(0)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    total_score: number;

    @ForeignKey(() => Subject)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    subject_id: number;

    @BelongsTo(() => Subject)
    subject!: Subject;

    @ForeignKey(() => Level)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    level_id: number;

    @BelongsTo(() => Level)
    level!: Level;

    @HasMany(() => PuzzleAssignment,{ onDelete: "CASCADE" })
    puzzle_assignments!: PuzzleAssignment[]
    

}