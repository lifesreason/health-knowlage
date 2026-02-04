import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({ description: '状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '提示信息', example: 'success' })
  msg: string;

  @ApiProperty({ description: '数据', nullable: true })
  data: any | null;

  @ApiProperty({ description: '时间戳', example: 1706889600000 })
  timestamp: number;
}

export class PaginationDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  pageSize?: number = 10;
}

export class PaginationResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}