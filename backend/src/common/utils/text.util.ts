/**
 * Đếm số từ của nội dung chương truyện (nội dung lưu dạng HTML).
 * - Loại bỏ toàn bộ thẻ HTML, giải mã một số entity phổ biến.
 * - Gộp mọi khoảng trắng / xuống dòng liên tiếp thành một dấu cách.
 * - Mỗi cụm ký tự phân tách bởi khoảng trắng được tính là 1 từ (phù hợp tiếng Việt).
 */
export function countWords(htmlContent?: string | null): number {
  if (!htmlContent) return 0;

  const plainText = htmlContent
    // Thẻ xuống dòng / kết thúc khối nên tách từ thay vì dính chữ
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|td|th)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    // Một số HTML entity thường gặp
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return 0;

  return plainText.split(' ').filter(Boolean).length;
}
