import { NextRequest } from "next/server";

export const runtime = "nodejs";

/** Google Translate TTS chỉ nhận tối đa ~200 ký tự mỗi lần. */
const MAX_TEXT_LENGTH = 180;

const GOOGLE_TTS_ENDPOINT = "https://translate.google.com/translate_tts";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Referer: "https://translate.google.com/",
  Accept: "*/*",
};

/**
 * Cầu nối lấy âm thanh đọc tiếng Việt miễn phí từ Google Translate.
 * Đặt ở server để tránh CORS và giấu chi tiết dịch vụ bên ngoài.
 */
export async function GET(request: NextRequest) {
  const text = (request.nextUrl.searchParams.get("text") ?? "").trim();

  if (!text) {
    return new Response("Thiếu nội dung cần đọc", { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response("Nội dung quá dài", { status: 413 });
  }

  const target = new URL(GOOGLE_TTS_ENDPOINT);
  target.searchParams.set("ie", "UTF-8");
  target.searchParams.set("client", "tw-ob");
  target.searchParams.set("tl", "vi");
  target.searchParams.set("q", text);

  let upstream: Response;

  try {
    upstream = await fetch(target, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
    });
  } catch {
    return new Response("Không kết nối được dịch vụ đọc", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Dịch vụ đọc trả về lỗi", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
