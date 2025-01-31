import { ApiProperty } from '@nestjs/swagger';
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

    @IsString()
    @IsNotEmpty()
    role: string
}


export class UpdateTeacherProfileDto {

    @ApiProperty({
        description: 'The title of the teacher',
        example: 'Dr.',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'The level ID of the teacher',
        example: 1,
    })
    @IsNumber()
    level_id: number;

    @ApiProperty({
        description: 'The user ID of the teacher',
        example: 123,
    })
    @IsNumber()
    user_id: number;

    @IsString()
    @IsNotEmpty()
    role: string
}

export class UpdateSuperIntendentProfileDto {
    @IsNumber()
    user_id: number

    @IsNumber()
    district_id: number;

    @IsString()
    @IsNotEmpty()
    role: string
}

export class UpdateAdminProfileDto {

    @IsNumber()
    user_id: number

    @IsNumber()
    school_id: number;
}



