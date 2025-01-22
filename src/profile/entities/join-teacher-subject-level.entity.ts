import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';
import { TeacherProfile } from './teacher-profile.entity';
import { Level } from 'src/level/entity/level.entity';
import { Subject } from 'src/subject/entity/subject.entity';


@Table({
    tableName: 'join-teacher-subject-level',
    timestamps: true,

})
export class JoinTeacherSubjectLevel extends Model {
    @PrimaryKey
    @Column({
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    id: number; //it must be equal to the id in User table

  
  
    @Column({
        type: DataType.INTEGER,
    })
    level_id: number;

  
    @ForeignKey(() => Subject)
    @Column({
        type: DataType.INTEGER,
    })
    subject_id: number;


    @ForeignKey(() => TeacherProfile)
    @Column({
        type: DataType.INTEGER
    })
    teacher_id: number // it will be the same as user id

    // @BelongsTo(() => TeacherProfile)
    // teacher!: TeacherProfile

    // @BelongsTo(() => Level)
    // level!: Level

    // @BelongsTo(() => Subject)
    // subject!: Subject

}
