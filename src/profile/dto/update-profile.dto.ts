import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateStudentProfileDto {

    @IsNumber()
    parent_id: number

    @IsNumber()
    level_id: number;

    @IsString({ message: 'level should be string' })
    @IsNotEmpty({ message: 'level should not be empty' })
    user_roll_no: string;

    @IsNumber()
    user_id: number;
}


