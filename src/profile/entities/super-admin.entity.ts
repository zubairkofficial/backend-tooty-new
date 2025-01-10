import {
    BelongsTo,
    Column,
    DataType,
    Default,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { User } from 'src/user/entities/user.entity';


@Table({
    tableName: 'super-admin-profile',
    timestamps: true,
    paranoid: true
})
export class SuperAdminProfile extends Model {
    @PrimaryKey
    @Column({
       
        type: DataType.INTEGER,
    })
    id: number;

    @Column({
        type: DataType.TEXT,
    })
    openai: string

    @Column({
        type: DataType.TEXT,
    })
    dalle: string

    @Column({
        type: DataType.TEXT,
    })
    deepgram: string

    @Column({
        type: DataType.TEXT,
    })
    master_prompt: string

    @Unique
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER
    })
    user_id: number;

    @BelongsTo(() => User)
    user!: User
}
