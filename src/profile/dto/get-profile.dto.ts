import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import the ApiProperty decorator

export class GetStudentProfileDto {
    @ApiProperty({ // This decorator is used to describe the property in Swagger UI
        description: 'The unique ID of the student',
        example: 123,  // Example value to show in Swagger
    })
    @IsNumber()
    user_id: number;
}
