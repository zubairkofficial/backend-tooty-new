import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    PrimaryKey,
    BelongsTo,
    Default,
} from 'sequelize-typescript';
import { Level } from 'src/level/entity/level.entity';
import { School } from 'src/school/entities/school.entity';


@Table({
    tableName: 'notifications',
    timestamps: true,
    paranoid: true
})
export class Notification extends Model {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true
    })
    id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    description: string;

    @ForeignKey(() => Level)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    level_id: number;

    @BelongsTo(() => Level)
    level: Level;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    isRead: boolean;

    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    school_id?: number;

    @BelongsTo(() => School)
    school?: School;
}
