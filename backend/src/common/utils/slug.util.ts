/**
 * Chuyển đổi chuỗi tiếng Việt thành slug thân thiện với URL
 * Ví dụ: "Tiên Hiệp & Kiếm Hiệp" -> "tien-hiep-kiem-hiep"
 */
export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // Đổi khoảng trắng thành gạch ngang
    .replace(/-+/g, '-'); // Bỏ dấu gạch lặp lại
}
