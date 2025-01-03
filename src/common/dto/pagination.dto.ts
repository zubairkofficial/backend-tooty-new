import { IsOptional, IsInt, Min } from 'class-validator';

export class PaginationDto {
    @IsOptional()
    @IsInt()
    @Min(1, { message: 'page must not be less than 1' })
    page: number = 1;  // Default to 1 if not provided

    @IsOptional()
    @IsInt()
    @Min(1, { message: 'limit must not be less than 1' })
    limit: number = 10;  // Default to 10 if not provided
}
