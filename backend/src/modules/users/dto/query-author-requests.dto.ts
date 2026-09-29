import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { AuthorRequestStatus } from '../schemas/author-request.schema.js';

export class QueryAuthorRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: AuthorRequestStatus,
    description: 'Lọc theo trạng thái yêu cầu (PENDING, APPROVED, REJECTED)',
  })
  @IsOptional()
  @IsEnum(AuthorRequestStatus, { message: 'Trạng thái không hợp lệ' })
  status?: AuthorRequestStatus;

  @ApiPropertyOptional({
    example: 'Nguyên Tác',
    description: 'Tìm kiếm theo bút danh hoặc tên tài khoản',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;
}
