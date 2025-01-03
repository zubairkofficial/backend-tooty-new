import { IsNumber } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class GetStudentsByLevelDto {

    @ApiProperty({
        description: 'The level ID to fetch students for',
        example: 1,  // Example value
    })
    @IsNumber()
    level_id: number;
}
