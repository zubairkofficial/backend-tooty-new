import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: 'Page number', default: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', default: 10 })
  limit: number;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  get paginationOptions(): { limit: number; offset: number } {
    return { limit: this.limit, offset: this.offset };
  }
}

export const paginate = (data: any[], total: number, page: number, limit: number) => ({
  data,
  total,
  page,
  totalPages: Math.ceil(total / limit),
});
