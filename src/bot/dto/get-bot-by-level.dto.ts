import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBotByLevelDto {

    @ApiProperty({
        description: 'The unique identifier for the level',
        example: 1, // Example value, change as per your system
    })
    @IsNumber()
    level_id: number;
}
