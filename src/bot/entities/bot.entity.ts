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
import { Join_BotContextData } from './join_botContextData.entity';
import { File } from 'src/context_data/entities/file.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';
import { Chat } from 'src/chat/entities/chat.entity';

@Table({
    tableName: 'bots',
    timestamps: true,
    paranoid: true
})
export class Bot extends Model {
    @PrimaryKey
    @Column({
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    id: number;

    @Column({
        type: DataType.STRING,
    })
    name: string;

    @Column({
        type: DataType.STRING,
    })
    display_name: string;

    @Column({
        type: DataType.TEXT,
    })
    description: string;

    @Column({
        type: DataType.TEXT,
    })
    first_message: string;

    @Column({
        type: DataType.STRING
    })
    bot_image_url: string

    @Column({
        type: DataType.STRING,
    })
    ai_model: string;


    @Column({
        type: DataType.STRING,
    })
    voice_model: string;

    @ForeignKey(() => Level)
    @Column({
        type: DataType.INTEGER,
    })
    level_id: number;

    @ForeignKey(() => Subject)
    @Column({
        type: DataType.INTEGER,
    })
    subject_id: number;

    @BelongsToMany(() => File, () => Join_BotContextData)
    files!: File[];

    @BelongsTo(() => Subject)
    subject!: Subject

    @BelongsTo(() => Level)
    level!: Level

    @HasMany(() => Chat, { onDelete: 'CASCADE' })
    chats!: Chat[]

    @BeforeUpdate
    static async removeBotContextOnLevelORSubjectChange(instance: Bot) {
        if (instance.changed("level_id") || instance.changed("subject_id")) {
            await Join_BotContextData.destroy({
                where: {
                    bot_id: instance.id
                }
            })
        }
    }
}
