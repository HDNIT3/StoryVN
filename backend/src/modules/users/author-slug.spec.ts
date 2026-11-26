import { describe, expect, it } from 'vitest';
import { authorSlugBase } from './author-slug.js';

describe('authorSlugBase', () => {
  it.each([
    ['Thiên tấm thổ đậu', 'thien-tam-tho-dau'],
    [' Đặng  Thái Sơn ', 'dang-thai-son'],
    ['Đăng ký', 'tac-gia-dang-ky'],
    ['stats', 'tac-gia-stats'],
    ['abcdef0123456789abcdef01', 'tac-gia-abcdef0123456789abcdef01'],
    ['✨✨', 'tac-gia'],
  ])('generates a compatible path from %s', (penName, slug) => {
    expect(authorSlugBase(penName)).toBe(slug);
  });
});
