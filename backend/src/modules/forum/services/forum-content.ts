import { BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { ForumContentFormat } from '../schemas/forum-post.schema.js';

function safeUrl(value: string, image: boolean): boolean {
  // URL parsers normalize control characters; reject them before protocol validation.
  // eslint-disable-next-line no-control-regex
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (image && /^\/uploads\/[^?#]+(?:[?#].*)?$/u.test(value)) {
    const url = new URL(value, 'https://forum.invalid');
    return url.pathname.startsWith('/uploads/');
  }
  if (!/^https?:\/\//iu.test(value) && (image || !/^mailto:/iu.test(value))) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:', ...(image ? [] : ['mailto:'])].includes(url.protocol);
  } catch {
    return false;
  }
}

export function prepareForumContent(content: string, format: ForumContentFormat): string {
  if (content.length > 20000) throw new BadRequestException('Content must not exceed 20000 characters');
  let result = content.trim();
  if (format === ForumContentFormat.HTML) {
    result = sanitizeHtml(result, {
      allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img'],
      allowedAttributes: {
        p: ['style'], h2: ['style'], h3: ['style'],
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
      },
      allowedStyles: {
        p: { 'text-align': [/^(left|center|right|justify)$/] },
        h2: { 'text-align': [/^(left|center|right|justify)$/] },
        h3: { 'text-align': [/^(left|center|right|justify)$/] },
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: { img: ['http', 'https'] },
      allowProtocolRelative: false,
      transformTags: {
        a: (tagName, attribs) => {
          if (!safeUrl(attribs.href ?? '', false)) delete attribs.href;
          if (attribs.target !== '_blank' && attribs.target !== '_self') delete attribs.target;
          delete attribs.rel;
          if (attribs.href) attribs.rel = 'noopener noreferrer';
          return { tagName, attribs };
        },
        img: (tagName, attribs) => {
          if (!safeUrl(attribs.src ?? '', true)) delete attribs.src;
          for (const dimension of ['width', 'height']) {
            if (!/^[1-9]\d{0,4}$/u.test(attribs[dimension] ?? '')) delete attribs[dimension];
          }
          return { tagName, attribs };
        },
      },
      exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
    }).trim();
    let visibleText = '';
    let hasImage = false;
    sanitizeHtml(result, {
      allowedTags: ['img'],
      textFilter: (text) => { visibleText += text; return text; },
      exclusiveFilter: (frame) => { if (frame.tag === 'img') hasImage = true; return false; },
    });
    if (!hasImage && !visibleText.replace(/&(?:nbsp|#160|#x0*a0);|[\s\p{Cf}\u034f\u2800]/giu, '')) {
      throw new BadRequestException('HTML content must contain visible text or a valid image');
    }
  }
  if (!result || result.length > 20000) throw new BadRequestException('Content must contain 1 to 20000 characters');
  return result;
}
