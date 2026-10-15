/**
 * Utility chuẩn hóa văn bản tiếng Việt
 * Khắc phục các lỗi:
 * 1. Dấu thanh bị gõ rời rạc (\u00B4, \u02CA, \u0060, \u02CB) sau nguyên âm
 * 2. Lỗi Unicode tổ hợp NFD sang NFC
 */
export function cleanVietnameseText(text?: string | null): string {
  if (!text) return "";

  // Bảng ánh xạ nguyên âm + dấu sắc rời (\u00B4 hoặc \u02CA)
  const acuteMap: Record<string, string> = {
    a: "á", ă: "ắ", â: "ấ", e: "é", ê: "ế", i: "í", o: "ó", ô: "ố", ơ: "ớ", u: "ú", ư: "ứ", y: "ý",
    A: "Á", Ă: "Ắ", Â: "Ấ", E: "É", Ê: "Ế", I: "Í", O: "Ó", Ô: "Ố", Ơ: "Ớ", U: "Ú", Ư: "Ứ", Y: "Ý",
    // Nếu nguyên âm vốn dĩ đã có mũ:
    ấ: "ấ", ắ: "ắ", ế: "ế", ố: "ố", ớ: "ớ", ứ: "ứ",
    Ấ: "Ấ", Ắ: "Ắ", Ế: "Ế", Ố: "Ố", Ớ: "Ớ", Ứ: "Ứ",
  };

  // Bảng ánh xạ nguyên âm + dấu huyền rời (` hoặc \u02CB)
  const graveMap: Record<string, string> = {
    a: "à", ă: "ằ", â: "ầ", e: "è", ê: "ề", i: "ì", o: "ò", ô: "ồ", ơ: "ờ", u: "ù", ư: "ừ", y: "ỳ",
    A: "À", Ă: "Ằ", Â: "Ầ", E: "È", Ê: "Ề", I: "Ì", O: "Ò", Ô: "Ồ", Ơ: "Ờ", U: "Ù", Ư: "Ừ", Y: "Ỳ",
    ầ: "ầ", ằ: "ằ", ề: "ề", ồ: "ồ", ờ: "ờ", ừ: "ừ",
    Ầ: "Ầ", Ằ: "Ằ", Ề: "Ề", Ồ: "Ồ", Ờ: "Ờ", Ừ: "Ừ",
  };

  // Bảng ánh xạ nguyên âm + dấu hỏi rời (\u02C0 hoặc dấu ?)
  const hookMap: Record<string, string> = {
    a: "ả", ă: "ẳ", â: "ẩ", e: "ẻ", ê: "ể", i: "ỉ", o: "ỏ", ô: "ổ", ơ: "ở", u: "ủ", ư: "ử", y: "ỷ",
    A: "Ả", Ă: "Ẳ", Â: "Ẩ", E: "Ẻ", Ê: "Ể", I: "Ỉ", O: "Ỏ", Ô: "Ổ", Ơ: "Ở", U: "Ủ", Ư: "Ử", Y: "Ỷ",
    ẩ: "ẩ", ẳ: "ẳ", ể: "ể", ổ: "ổ", ở: "ở", ử: "ử",
    Ẩ: "Ẩ", Ẳ: "Ẳ", Ể: "Ể", Ổ: "Ổ", Ở: "Ở", Ử: "Ử",
  };

  // Bảng ánh xạ nguyên âm + dấu ngã rời (~ hoặc \u02DC)
  const tildeMap: Record<string, string> = {
    a: "ã", ă: "ẵ", â: "ẫ", e: "ẽ", ê: "ễ", i: "ĩ", o: "õ", ô: "ỗ", ơ: "ỡ", u: "ũ", ư: "ữ", y: "ỹ",
    A: "Ã", Ă: "Ẵ", Â: "Ẫ", E: "Ẽ", Ê: "Ễ", I: "Ĩ", O: "Õ", Ô: "Ỗ", Ơ: "Ỡ", U: "Ũ", Ư: "Ữ", Y: "Ỹ",
    ẫ: "ẫ", ẵ: "ẵ", ễ: "ễ", ỗ: "ỗ", ỡ: "ỡ", ữ: "ữ",
    Ẫ: "Ẫ", Ẵ: "Ẵ", Ễ: "Ễ", Ỗ: "Ỗ", Ỡ: "Ỡ", Ữ: "Ữ",
  };

  let cleaned = text
    // 1. Dấu sắc rời
    .replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\u00B4\u02CA\u0301]/g, (match, char) => {
      return acuteMap[char] || char;
    })
    // 2. Dấu huyền rời
    .replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\u0060\u02CB\u0300]/g, (match, char) => {
      return graveMap[char] || char;
    })
    // 3. Dấu ngã rời
    .replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\u02DC\u0303]/g, (match, char) => {
      return tildeMap[char] || char;
    })
    // 4. Dấu hỏi rời
    .replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\u0309]/g, (match, char) => {
      return hookMap[char] || char;
    })
    // 5. Chuẩn hóa về NFC
    .normalize("NFC");

  return cleaned;
}
