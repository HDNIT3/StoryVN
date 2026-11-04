/**
 * Chuyển nội dung chương (HTML từ trình soạn thảo hoặc văn bản thuần) sang
 * văn bản thuần để đưa vào bộ đọc tiếng nói của trình duyệt.
 *
 * Lưu ý: giữ nguyên dấu tiếng Việt (không chuẩn hoá NFD) để giọng đọc phát âm đúng.
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

function decodeEntities(input: string): string {
  let text = input;

  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    text = text.split(entity).join(char);
  }

  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Bóc thẻ HTML, đổi thẻ khối (`p`, `div`, `br`, tiêu đề, `li`...) thành xuống dòng,
 * giải mã entity và gộp khoảng trắng thừa.
 */
export function htmlToPlainText(content?: string | null): string {
  if (!content) return "";

  const withLineBreaks = content
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|h[1-6]|blockquote|li|tr|section|article)\s*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|blockquote|li|tr|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  return normalizeWhitespace(decodeEntities(withLineBreaks));
}

/**
 * Danh sách thẻ được coi là một "đoạn" trong trình đọc.
 * Dùng chung cho cả lúc bóc nội dung và lúc tô sáng để chỉ số đoạn luôn khớp.
 */
export const CONTENT_BLOCK_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre";

function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(content);
}

/**
 * Tách nội dung chương thành từng đoạn văn (khớp thứ tự các thẻ được render).
 */
export function extractContentBlocks(content?: string | null): string[] {
  if (!content) return [];

  if (!looksLikeHtml(content)) {
    return content
      .split(/\n+/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);
  }

  if (typeof DOMParser === "undefined") {
    return htmlToPlainText(content).split(/\n+/).filter(Boolean);
  }

  try {
    const doc = new DOMParser().parseFromString(content, "text/html");
    const nodes = Array.from(doc.body.querySelectorAll(CONTENT_BLOCK_SELECTOR));
    const blocks = nodes
      .map((node) => normalizeWhitespace(node.textContent ?? ""))
      .filter(Boolean);

    if (blocks.length > 0) return blocks;

    return htmlToPlainText(content).split(/\n+/).filter(Boolean);
  } catch {
    return htmlToPlainText(content).split(/\n+/).filter(Boolean);
  }
}
