import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Google Translate TTS hoạt động ổn định nhất khi độ dài mỗi câu <= 140 ký tự.
 */
const MAX_TEXT_LENGTH = 140;

const GOOGLE_TTS_ENDPOINT = "https://translate.google.com/translate_tts";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Referer: "https://translate.google.com/",
  Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
};

// Frame MP3 im lặng (26ms) chuẩn MPEG-1 Layer 3 để trả về thay vì báo lỗi 400 nếu câu chỉ có ký tự đặc biệt
const SILENT_MP3_BASE64 =
  "//NAxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
const SILENT_MP3_BUFFER = Buffer.from(SILENT_MP3_BASE64, "base64");

/**
 * Cầu nối lấy âm thanh đọc tiếng Việt miễn phí từ Google Translate.
 * Đặt ở server để tránh CORS và giấu chi tiết dịch vụ bên ngoài.
 */
export async function GET(request: NextRequest) {
  const rawText = (request.nextUrl.searchParams.get("text") ?? "").trim();

  // Loại bỏ dấu ngoặc kép và các ký tự đặc biệt khiến Google TTS đọc thành chữ "ngoặc kép" / "dấu ngoặc kép"
  const text = rawText
    .replace(/["“”«»„‟″`]/g, " ")
    .replace(/(^|[\s.,!?;:…])['‘]([^'’]+)['’]([\s.,!?;:…]|$)/g, "$1$2$3")
    .replace(/['‘’]/g, " ")
    .replace(/[*=\-_~]{2,}/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .trim();

  // Nếu câu không có nội dung chữ để đọc (ví dụ dòng phân cách, emoji, ký tự lạ),
  // trả về MP3 im lặng ngắn thay vì ném HTTP 400 làm đứt phiên đọc của client.
  if (!text || !/[\p{L}\p{N}]/u.test(text)) {
    return new Response(SILENT_MP3_BUFFER, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  // Cắt ngắn nếu vượt quá giới hạn an toàn để không bị Google 404/403
  const safeText = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH).trim() : text;

  const target = new URL(GOOGLE_TTS_ENDPOINT);
  target.searchParams.set("ie", "UTF-8");
  target.searchParams.set("client", "tw-ob");
  target.searchParams.set("tl", "vi");
  target.searchParams.set("q", safeText);

  let upstream: Response;

  try {
    upstream = await fetch(target, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(6500),
    });
  } catch {
    // Nếu timeout hoặc mạng server lỗi, trả về silent MP3 để client không bị đơ
    return new Response(SILENT_MP3_BUFFER, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Fallback": "silent-on-timeout",
      },
    });
  }

  if (!upstream.ok || !upstream.body) {
    // Nếu Google rate-limit (429) hoặc chặn IP, trả về silent mp3 thay vì 502
    return new Response(SILENT_MP3_BUFFER, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Fallback": "silent-on-upstream-error",
      },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
