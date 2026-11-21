import sanitizeHtml from 'sanitize-html';

export function plainText(value: string): string {
  return sanitizeHtml(
    value.replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|blockquote)>/gi, ' '),
    {
      allowedTags: [],
      allowedAttributes: {},
    },
  )
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const point =
        code.startsWith('x') || code.startsWith('X')
          ? Number.parseInt(code.slice(1), 16)
          : Number.parseInt(code, 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function mergeSearchRanks(
  keyword: string[],
  semantic: string[],
  exact: string[] = [],
): string[] {
  const scores = new Map<string, number>();
  for (const list of [keyword, semantic])
    list.forEach((id, i) =>
      scores.set(id, (scores.get(id) || 0) + 1 / (61 + i)),
    );
  const pinned = new Set(exact);
  return [...scores.keys()].sort(
    (a, b) =>
      Number(pinned.has(b)) - Number(pinned.has(a)) ||
      scores.get(b)! - scores.get(a)! ||
      a.localeCompare(b),
  );
}
