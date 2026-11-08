/**
 * Chuyển nội dung chương (HTML từ trình soạn thảo hoặc văn bản thuần) sang
 * danh sách các đoạn văn chuẩn hóa và văn bản thuần để phục vụ hiển thị & đọc tiếng nói.
 *
 * Lưu ý: Giữ nguyên dấu tiếng Việt chuẩn Unicode NFC để giọng đọc phát âm đúng.
 */

const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

export function decodeEntities(input: string): string {
  let text = input;

  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    text = text.split(entity).join(char);
  }

  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Bóc thẻ HTML, đổi thẻ khối thành xuống dòng, giải mã entity và gộp khoảng trắng thừa.
 */
export function htmlToPlainText(content?: string | null): string {
  if (!content) return "";

  const withLineBreaks = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(
      /<\s*\/\s*(p|div|h[1-6]|blockquote|li|tr|section|article)\s*>/gi,
      "\n\n"
    )
    .replace(
      /<\s*(p|div|h[1-6]|blockquote|li|tr|section|article)[^>]*>/gi,
      "\n"
    )
    .replace(/<[^>]*>/g, " ");

  return normalizeWhitespace(decodeEntities(withLineBreaks));
}

/**
 * Thẻ selector để query block trong DOM (giữ tương thích).
 */
export const CONTENT_BLOCK_SELECTOR =
  "p, [data-block-index], h1, h2, h3, h4, h5, h6, li, blockquote, pre";

export function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export interface ChapterBlock {
  /** Chỉ số thứ tự của đoạn văn (0, 1, 2, ...). */
  index: number;
  /** Nội dung HTML an toàn của đoạn văn dùng để render giao diện. */
  html: string;
  /** Văn bản thuần của đoạn văn dùng cho TTS và highlight. */
  text: string;
}

/**
 * Làm sạch HTML bên trong mỗi đoạn văn, loại bỏ script/style/iframe rác,
 * chỉ giữ lại text và các thẻ inline cơ bản (b, i, strong, em, u, s, span, a, br).
 */
function sanitizeSegmentHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<\s*(?:script|style|iframe|form|button|input)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|form|button|input)\s*>/gi, "")
    .replace(/<(?!\/?(?:b|strong|i|em|u|s|strike|span|a|br)\b)[^>]*>/gi, "")
    .trim();
}

/**
 * Tách nội dung chương truyện (dù là HTML dạng <p>, HTML có <br><br>, HTML dạng <div>, hay văn bản thuần)
 * thành danh sách các đoạn văn chuẩn hoá đồng nhất 100% giữa giao diện hiển thị và phát thanh TTS.
 */
export function parseChapterBlocks(content?: string | null): ChapterBlock[] {
  if (!content) return [];

  // Chuẩn hoá xuống dòng và ký tự ẩn
  const cleanSource = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, "");

  const hasHtml = looksLikeHtml(cleanSource);

  const rawSegments: { html: string; text: string }[] = [];

  if (hasHtml) {
    // 1. Chuẩn hoá các dạng ngắt đoạn trong HTML:
    // - Hai hoặc nhiều thẻ <br> liên tiếp (kể cả có &nbsp; hoặc khoảng trắng) được coi là phân đoạn mới.
    // - Các thẻ kết thúc khối </p>, </div>, </blockquote>, </li>, </h1-6> được coi là ranh giới phân đoạn.
    const normalizedHtml = cleanSource
      .replace(/(?:<\s*br\s*\/?>[\s\u00a0]*){2,}/gi, "<!--__SPLIT__-->")
      .replace(/<\s*\/\s*(p|div|h[1-6]|blockquote|li|section|article)\s*>/gi, "<!--__SPLIT__-->")
      .replace(/<\s*(p|div|h[1-6]|blockquote|li|section|article)[^>]*>/gi, "")
      .replace(/<\s*p\s*>\s*<\s*\/\s*p\s*>/gi, "");

    const parts = normalizedHtml.split("<!--__SPLIT__-->");

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      // Nếu bên trong đoạn vẫn còn chứa nhiều dòng \n\n (do plain text lồng trong thẻ)
      const subParts = trimmedPart.split(/\n\s*\n+/);
      for (const sub of subParts) {
        const textContent = normalizeWhitespace(
          decodeEntities(sub.replace(/<[^>]*>/g, " "))
        );
        if (!textContent) continue;

        const safeHtml = sanitizeSegmentHtml(sub);
        rawSegments.push({
          html: safeHtml || escapeHtml(textContent),
          text: textContent,
        });
      }
    }
  } else {
    // Văn bản thuần:
    // Kiểm tra xem văn bản có phân đoạn bằng \n\n không.
    // Nếu có \n\n thì tách bằng \n\n+. Nếu không có \n\n (chỉ có \n đơn lẻ) thì tách theo \n+.
    const hasDoubleNewlines = /\n\s*\n/.test(cleanSource);
    const splitRegex = hasDoubleNewlines ? /\n\s*\n+/ : /\n+/;
    const lines = cleanSource.split(splitRegex);

    for (const line of lines) {
      const textContent = normalizeWhitespace(line);
      if (!textContent) continue;

      rawSegments.push({
        html: escapeHtml(textContent),
        text: textContent,
      });
    }
  }

  // Đánh chỉ số thứ tự 0, 1, 2, ...
  return rawSegments.map((seg, idx) => ({
    index: idx,
    html: seg.html,
    text: seg.text,
  }));
}

/**
 * Trích xuất mảng text thuần của các đoạn văn (tương thích ngược với các nơi cũ).
 */
export function extractContentBlocks(content?: string | null): string[] {
  return parseChapterBlocks(content).map((b) => b.text);
}
