import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateForumPostDto, UpdateForumPostDto } from '../dto/forum.dto.js';
import { ForumContentFormat } from '../schemas/forum-post.schema.js';
import { prepareForumContent } from './forum-content.js';

const html = (value: string) => prepareForumContent(value, ForumContentFormat.HTML);

describe('forum content sanitization', () => {
  it('preserves plain text for escaped rendering', () => {
    expect(prepareForumContent(' <script>alert(1)</script> ', ForumContentFormat.PLAIN)).toBe('<script>alert(1)</script>');
  });

  it('removes executable elements, events and unapproved attributes', () => {
    expect(html('<script>alert(1)</script><style>p{display:none}</style><iframe src="https://evil.test"></iframe><p onclick="alert(1)" class="x"><strong>Safe</strong><svg onload="alert(1)"></svg></p>'))
      .toBe('<p><strong>Safe</strong></p>');
  });

  it.each(['javascript:alert(1)', 'jav&#x61;script:alert(1)', 'java&#10;script:alert(1)', 'data:text/html,evil', 'blob:https://example.com/id', '//evil.test/x', '/relative'])('rejects link protocol %s', (url) => {
    expect(html(`<a href="${url}" target="_blank" rel="opener">link</a>`)).toBe('<a target="_blank">link</a>');
  });

  it.each(['http://example.com', 'https://example.com/path?q=1', 'mailto:user@example.com'])('allows safe link %s and forces rel', (url) => {
    expect(html(`<a href="${url}" target="_blank" rel="opener" title="Link">link</a>`)).toBe(`<a href="${url}" target="_blank" title="Link" rel="noopener noreferrer">link</a>`);
  });

  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', 'blob:https://example.com/id', '//example.com/img', '/other/image.png', '/uploads/../evil', '/uploads/%2e%2e/evil', '/uploads/\\evil', 'mailto:user@example.com'])('removes unsafe image %s', (url) => {
    expect(html(`<p>text</p><img src="${url}" onerror="alert(1)">`)).toBe('<p>text</p>');
  });

  it.each(['https://example.com/a.png', 'http://example.com/a.png', '/uploads/forum/a.png'])('accepts image-only post %s', (url) => {
    expect(html(`<img src="${url}" alt="photo" width="640" height="480" onerror="alert(1)">`)).toBe(`<img src="${url}" alt="photo" width="640" height="480" />`);
  });

  it('strips invalid dimensions and permits only scoped text alignment', () => {
    expect(html('<p style="text-align:center;color:red">P</p><h2 style="text-align:right">H</h2><h3 style="text-align:justify">H</h3><blockquote style="text-align:left">Q</blockquote><p style="text-align:expression(alert(1))">P</p><img src="/uploads/a.png" width="100%" height="-1">'))
      .toBe('<p style="text-align:center">P</p><h2 style="text-align:right">H</h2><h3 style="text-align:justify">H</h3><blockquote>Q</blockquote><p>P</p><img src="/uploads/a.png" />');
  });

  it.each(['<p><br></p>', '<hr>', '<p>&nbsp; &#160; &#xA0;</p>', '<p>\u200b\u200d\ufeff</p>', '<script>text</script>', '<img src="data:image/png,foo">'])('rejects visually empty HTML %s', (value) => {
    expect(() => html(value)).toThrow(BadRequestException);
  });

  it('enforces both raw and sanitized size limits', () => {
    expect(() => html(`<p>${'a'.repeat(20000)}</p>`)).toThrow(BadRequestException);
    expect(() => html('&'.repeat(5000))).toThrow(BadRequestException);
    expect(html('a'.repeat(20000))).toHaveLength(20000);
  });
});

describe('forum format DTO validation', () => {
  it.each([CreateForumPostDto, UpdateForumPostDto])('accepts only omitted/plain/html format in %s', async (Dto) => {
    for (const format of [undefined, 'plain', 'html']) {
      expect(await validate(plainToInstance(Dto, { title: 'Title', content: 'Text', contentFormat: format }))).toHaveLength(0);
    }
    for (const format of [null, '', 'markdown', 1]) {
      const errors = await validate(plainToInstance(Dto, { title: 'Title', content: 'Text', contentFormat: format }));
      expect(errors.some((error) => error.property === 'contentFormat')).toBe(true);
    }
  });
});
