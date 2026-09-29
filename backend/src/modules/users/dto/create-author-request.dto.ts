import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAuthorRequestDto {
  @ApiProperty({
    example: 'Nguyên Tác',
    description: 'Bút danh của tác giả',
  })
  @IsString({ message: 'Bút danh phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Bút danh không được để trống' })
  @MinLength(2, { message: 'Bút danh phải có ít nhất 2 ký tự' })
  penName: string;

  @ApiPropertyOptional({
    example: 'Tác giả chuyên sáng tác các thể loại tiên hiệp, huyền huyễn...',
    description: 'Tiểu sử hoặc giới thiệu tóm tắt của tác giả (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  biography?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện riêng của tác giả (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://authorblog.vn',
    description: 'Website cá nhân của tác giả (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Website phải là chuỗi ký tự' })
  website?: string;

  @ApiPropertyOptional({
    example: { facebook: 'https://facebook.com/author', twitter: 'https://x.com/author' },
    description: 'Các liên kết mạng xã hội của tác giả (tùy chọn)',
  })
  @IsOptional()
  @IsObject({ message: 'Mạng xã hội phải là một object chứa các liên kết' })
  socialLinks?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Vietcombank',
    description: 'Tên ngân hàng nhận tiền rút / nhuận bút (tùy chọn, có thể bổ sung sau)',
  })
  @IsOptional()
  @IsString({ message: 'Tên ngân hàng phải là chuỗi ký tự' })
  bankName?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Số tài khoản ngân hàng nhận tiền (tùy chọn, có thể bổ sung sau)',
  })
  @IsOptional()
  @IsString({ message: 'Số tài khoản ngân hàng phải là chuỗi ký tự' })
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'NGUYEN VAN A',
    description: 'Tên chủ tài khoản ngân hàng (tùy chọn, có thể bổ sung sau)',
  })
  @IsOptional()
  @IsString({ message: 'Tên chủ tài khoản phải là chuỗi ký tự' })
  bankAccountName?: string;

  @ApiPropertyOptional({
    example: 'Tôi có kinh nghiệm viết truyện và muốn xuất bản tác phẩm trên StoryVN',
    description: 'Lý do hoặc ghi chú khi gửi yêu cầu nâng cấp tác giả (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  reason?: string;
}
