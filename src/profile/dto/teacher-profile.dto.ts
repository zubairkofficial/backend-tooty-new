import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";




export class GetJoinsTeacherSubjectLevelDto {

    @ApiProperty({
        description: 'The user ID of the teacher to get subjects for',
        example: 123,
    })
    @IsNumber()
    user_id: number;
}
export class GetTeacherProfileDto {

    @ApiProperty({
        description: 'The user ID of the teacher to get the profile',
        example: 123,
    })
    @IsNumber()
    user_id: number;
}

export class CreateJoinTeacherSubjectLevel {

    @ApiProperty({
        description: 'The level ID the teacher will be assigned to',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    level_id: number;

    @ApiProperty({
        description: 'The list of subject IDs to assign the teacher',
        type: [Number],
        example: [1, 2, 3],  // Example with multiple subject IDs
    })
    @IsNotEmpty()
    subject_id: any[];

    @ApiProperty({
        description: 'The teacher ID (which is equal to user_id)',
        example: 123,
    })
    @IsNumber()
    @IsNotEmpty()
    teacher_id: number;
}
export class DeleteJoinTeacherSubjectLevel {

    @ApiProperty({
        description: 'The level ID from which the teacher will be removed',
        example: 1,
    })
    @IsNumber()
    level_id: number;

    @ApiProperty({
        description: 'The subject ID to be removed from the teacher',
        example: 2,
    })
    @IsNumber()
    subject_id: number;

    @ApiProperty({
        description: 'The teacher ID (which is equal to user_id)',
        example: 123,
    })
    @IsNumber()
    teacher_id: number;
}
