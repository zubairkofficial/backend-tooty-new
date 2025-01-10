import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';

import { Bot } from '../../bot/entities/bot.entity';
import { Join_BotContextData } from '../../bot/entities/join_botContextData.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { School } from 'src/school/entities/school.entity';


@Table({
    tableName: 'files',
    timestamps: true,
    paranoid: true
})
export class File extends Model {
    @PrimaryKey
    @Column({
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    id: number;

    @ForeignKey(() => School)
    @Column({
        type: DataType.INTEGER,
    })
    school_id: number;

    @ForeignKey(() => Subject)
    @Column({
        type: DataType.INTEGER,
    })
    subject_id: number;


    @Column({
        type: DataType.INTEGER,
    })
    processed: number;

    @Column({
        type: DataType.STRING,
    })
    file_name: string;

    @Unique
    @Column({
        type: DataType.STRING,
    })
    slug: string;

    @BelongsTo(() => School, { onDelete: 'CASCADE' })
    school!: School;

    @BelongsTo(() => Subject)
    subject!: Subject;

    @BelongsToMany(() => Bot, () => Join_BotContextData)
    bots!: Bot[];
}
