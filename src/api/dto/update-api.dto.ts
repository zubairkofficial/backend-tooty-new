import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApiKeyDto {
    @ApiProperty({
        description: 'The API key that needs to be updated',
        example: '1234567890abcdef',
    })
    @IsString()
    @IsNotEmpty()
    api_key: string;

    @ApiProperty({
        description: 'The name of the API that is being updated',
        example: 'Deepgram API',
    })
    @IsString()
    @IsNotEmpty()
    api_name: string;
}

export class GetVoiceModelDto {
    @ApiProperty({
        description: 'The ID of the voice model to retrieve',
        example: 'model_12345',
    })
    @IsString()
    @IsNotEmpty()
    model_id: string;
}
