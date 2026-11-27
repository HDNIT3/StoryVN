import { toSlug } from '../../common/utils/slug.util.js';

const reservedAuthorRoutes = new Set([
  'me', 'stats', 'dang-ky', 'tong-quan', 'tac-pham', 'chuong-truyen', 'doanh-thu',
]);

export function isReservedAuthorSlug(slug: string): boolean {
  return reservedAuthorRoutes.has(slug) || /^[a-f0-9]{24}$/.test(slug);
}

export function authorSlugBase(penName: string): string {
  const slug = toSlug(penName).slice(0, 100).replace(/^-+|-+$/g, '') || 'tac-gia';
  return isReservedAuthorSlug(slug)
    ? `tac-gia-${slug}`
    : slug;
}
