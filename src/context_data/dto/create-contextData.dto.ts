import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({
    description: 'The name of the file being uploaded.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({
    description: 'A slug identifier for the file.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'The ID of the subject associated with the file.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  subject_id: string;
}

export class DeleteFileDto {
  @ApiProperty({
    description: 'The ID of the file to be deleted.',
    type: Number,
  })
  @IsNumber()
  id: number;
}

export class GetFilesBySubjectDto {
  @ApiProperty({
    description: 'The ID of the subject for which files should be fetched.',
    type: Number,
  })
  @IsNumber()
  subject_id: number;
}
