"use client";

import DOMPurify from "dompurify";
import { useSyncExternalStore } from "react";
import type { ForumPost } from "../types";
import { API_BASE_URL } from "@/lib/api";

export function safeForumUrl(value: string): boolean {
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/uploads/")) {
    try { return !decodeURIComponent(value).split(/[/?#]/).some(part => part === ".." || part === ".") && !/%(?:2f|5c|00)/i.test(value); } catch { return false; }
  }
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !!url.hostname; } catch { return false; }
}

export function resolveForumUrl(value: string) {
  return value.startsWith("/uploads/") ? new URL(value, new URL(API_BASE_URL, window.location.origin)).href : value;
}

export function plainToHtml(value: string) {
  return `<p>${value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, "<br>")}</p>`;
}

export function sanitizeForumHtml(value: string, localUrls?: Set<string>): string {
  const fragment = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ["h2", "h3", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "hr", "a", "img"],
    ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "width", "height", "style"],
    ALLOW_DATA_ATTR: false, RETURN_DOM_FRAGMENT: true,
    ADD_URI_SAFE_ATTR: localUrls ? ["src"] : [],
  });
  fragment.querySelectorAll("*").forEach(element => {
    for (const attr of [...element.attributes]) {
      const allowed = attr.name === "style" || attr.name === "title" ||
        (element.tagName === "A" && ["href", "target", "rel"].includes(attr.name)) ||
        (element.tagName === "IMG" && ["src", "alt", "width", "height"].includes(attr.name));
      if (!allowed) element.removeAttribute(attr.name);
    }
    const alignment = (element as HTMLElement).style.textAlign;
    element.removeAttribute("style");
    if (["left", "center", "right", "justify"].includes(alignment)) element.setAttribute("style", `text-align: ${alignment}`);
    for (const attr of ["href", "src"]) {
      const url = element.getAttribute(attr);
      if (url && !safeForumUrl(url) && !(attr === "src" && localUrls?.has(url))) element.removeAttribute(attr);
      else if (url?.startsWith("/uploads/")) element.setAttribute(attr, resolveForumUrl(url));
    }
    if (element.tagName === "IMG" && !element.getAttribute("src")) element.remove();
    if (element.tagName === "A") { element.setAttribute("rel", "noopener noreferrer nofollow"); if (element.getAttribute("target") !== "_blank") element.removeAttribute("target"); }
  });
  const container = document.createElement("div");
  container.append(fragment);
  return container.innerHTML;
}

export const forumContentClass = "break-words text-base leading-7 text-slate-700 [&_h2]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-sky-300 [&_blockquote]:bg-sky-50 [&_blockquote]:px-4 [&_blockquote]:italic [&_a]:text-sky-700 [&_a]:underline [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain [&_hr]:my-6";
const subscribe = () => () => {};

export function ForumContent({ post, preview }: { post: Pick<ForumPost, "content" | "contentFormat">; preview?: number }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (post.contentFormat !== "html") return <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{preview && post.content.length > preview ? `${post.content.slice(0, preview)}…` : post.content}</p>;
  if (!mounted) return <p className="text-sm text-slate-400">Đang tải nội dung…</p>;
  const html = sanitizeForumHtml(post.content);
  if (preview) {
    const container = document.createElement("div");
    container.innerHTML = html;
    container.querySelectorAll("p,h2,h3,li,br,blockquote").forEach(el => el.append(" "));
    const text = container.textContent?.replace(/\s+/g, " ").trim() || "Bài viết có hình ảnh";
    return <p className="break-words text-sm leading-7 text-slate-600">{text.length > preview ? `${text.slice(0, preview)}…` : text}</p>;
  }
  return <div className={forumContentClass} dangerouslySetInnerHTML={{ __html: html }} />;
}
