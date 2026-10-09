import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryProgressState } from '../schemas/story.schema.js';

export enum StorySortOption {
  NEWEST_PUBLISHED = 'published', // Mới xuất bản
  LATEST_UPDATED = 'updated',     // Mới cập nhật
  MOST_VIEWED = 'views',          // Lượt xem/đọc cao nhất
  CHAPTER_COUNT = 'chapters',     // Nhiều chương nhất
  TOP_RATED = 'rating',           // Đánh giá cao nhất
}

export class FilterStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên tác phẩm hoặc bút danh tác giả',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo Thể loại: truyền slug (vd: "do-thi") hoặc ObjectId của thể loại',
  })
  @IsOptional()
  @IsString({ message: 'Thể loại phải là chuỗi' })
  genre?: string;

  @ApiPropertyOptional({
    enum: StoryProgressState,
    description: 'Trạng thái tiến độ: ONGOING (Đang ra), COMPLETED (Hoàn thành), ON_HOLD (Tạm ngưng)',
  })
  @IsOptional()
  @IsEnum(StoryProgressState, { message: 'Trạng thái tiến độ không hợp lệ' })
  progressState?: StoryProgressState;

  @ApiPropertyOptional({
    enum: StorySortOption,
    default: StorySortOption.NEWEST_PUBLISHED,
    description: 'Tiêu chí sắp xếp: published (Mới xuất bản), updated (Mới cập nhật), views (Lượt đọc), chapters (Số chương), rating (Đánh giá)',
  })
  @IsOptional()
  @IsEnum(StorySortOption, { message: 'Tiêu chí sắp xếp không hợp lệ' })
  sortBy?: StorySortOption = StorySortOption.NEWEST_PUBLISHED;
}
