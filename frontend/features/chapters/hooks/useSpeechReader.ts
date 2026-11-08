"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseChapterBlocks } from "@/lib/utils/htmlToPlainText";

export type TtsStatus = "idle" | "loading" | "playing" | "paused" | "done";

/** Các mức tốc độ cho phép. */
export const TTS_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Số ký tự tối đa an toàn mỗi mẩu đọc (Google TTS tiếng Việt hoạt động ổn định nhất <= 130 ký tự).
 */
const SAFE_MAX_CHUNK_LENGTH = 120;
const STORAGE_SPEED = "reader_tts_speed";

interface TtsChunk {
  /** Văn bản gốc (dùng để tô sáng đúng câu trong bài viết). */
  text: string;
  /** Văn bản đã lọc bỏ ngoặc kép / ký tự lạ (dành riêng cho giọng đọc phát âm). */
  spokenText: string;
  /** Chỉ số đoạn văn tương ứng. */
  blockIndex: number;
}

export interface UseSpeechReaderResult {
  /** Chương có nội dung để đọc hay không. */
  ready: boolean;
  status: TtsStatus;
  currentIndex: number;
  totalChunks: number;
  speed: number;
  /** Đoạn văn đang được đọc (để tô sáng). */
  activeBlockIndex: number;
  /** Câu đang được đọc (để tô sáng chính xác từng câu). */
  activeText: string;
  /** Đang trong phiên đọc (kể cả tạm dừng) — dùng để bật/tắt tô sáng. */
  highlighting: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  /** Bắt đầu nghe từ đoạn văn cụ thể (người dùng bấm chọn đoạn). */
  playFromBlock: (blockIndex: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * Loại bỏ dấu ngoặc kép và các ký tự đặc biệt khiến Google TTS phát âm thành chữ "ngoặc kép", "dấu ngoặc kép".
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Bỏ tất cả các loại dấu ngoặc kép đôi
    .replace(/["“”«»„‟″`]/g, " ")
    // Bỏ dấu nháy đơn bao quanh lời thoại hoặc đứng độc lập
    .replace(/(^|[\s.,!?;:…])['‘]([^'’]+)['’]([\s.,!?;:…]|$)/g, "$1$2$3")
    .replace(/['‘’]/g, " ")
    // Bỏ các ký tự chia đoạn truyện (ví dụ: ***, ---, ===) tránh phát âm "sao sao sao"
    .replace(/[*=\-_~]{2,}/g, " ")
    // Bỏ các ký hiệu ngoặc không cần đọc to
    .replace(/[()[\]{}<>]/g, " ")
    // Gộp khoảng trắng thừa
    .replace(/[ \t\f\v]+/g, " ")
    .trim();
}

/**
 * Tách một đoạn văn bản thành các câu hoặc mệnh đề ngắn vừa phải,
 * không ngắt lìa dấu ngoặc kép hay để sót các mẩu rác chỉ có dấu câu.
 */
export function splitIntoChunks(text: string): string[] {
  if (!text) return [];

  // Tách câu theo dấu chấm, chấm than, hỏi chấm, ba chấm (giữ lại dấu đóng ngoặc kép/đơn đi kèm)
  const rawSentences =
    text.match(/[^.!?…\n]+(?:[.!?…]+["”'’»)]*)?/g) ?? [text];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    let sentence = raw.trim();
    if (!sentence) continue;

    while (sentence.length > SAFE_MAX_CHUNK_LENGTH) {
      const sub = sentence.slice(0, SAFE_MAX_CHUNK_LENGTH);

      // Tìm điểm ngắt tốt nhất: dấu phẩy, chấm phẩy, hai chấm, gạch ngang
      const commaIdx = Math.max(
        sub.lastIndexOf(", "),
        sub.lastIndexOf("; "),
        sub.lastIndexOf(": "),
        sub.lastIndexOf(" - ")
      );

      let cut = -1;
      if (commaIdx >= 35) {
        cut = commaIdx + 1;
      } else {
        // Nếu không có dấu câu, cắt tại khoảng trắng gần nhất
        cut = sub.lastIndexOf(" ");
        if (cut < 30) cut = SAFE_MAX_CHUNK_LENGTH;
      }

      const part = sentence.slice(0, cut).trim();
      if (part) chunks.push(part);
      sentence = sentence.slice(cut).trim();
    }

    if (sentence) chunks.push(sentence);
  }

  return chunks;
}

function readSavedSpeed(): number {
  try {
    if (typeof window === "undefined") return 1;
    const value = Number(window.localStorage.getItem(STORAGE_SPEED));
    return (TTS_SPEED_OPTIONS as readonly number[]).includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

function buildTtsUrl(text: string): string {
  return `/api/tts?text=${encodeURIComponent(text)}`;
}

/**
 * Đọc nội dung chương bằng giọng tiếng Việt kết hợp thông minh:
 * 1. Ưu tiên âm thanh tự nhiên từ Google Translate TTS (/api/tts).
 * 2. Tự động dự phòng sang Web Speech API (window.speechSynthesis) khi mạng lỗi hoặc Google rate-limit.
 * 3. Chống kẹt/đơ audio: luôn tiếp tục câu kế tiếp, không bao giờ ngưng giữa chừng.
 */
export function useSpeechReader(content?: string | null): UseSpeechReaderResult {
  const [status, setStatus] = useState<TtsStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeedState] = useState<number>(readSavedSpeed);
  const [contentKey, setContentKey] = useState(content);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<TtsChunk[]>([]);
  const indexRef = useRef(0);
  const generationRef = useRef(0);
  const speedRef = useRef(speed);
  const statusRef = useRef<TtsStatus>("idle");
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  /** spokenText -> Promise<blob url> (đã tải xong hoặc đang tải). */
  const audioCacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const playChunkRef = useRef<(index: number) => void>(() => {});

  // Tách khối đoạn văn và câu thông minh
  const chunks = useMemo(() => {
    const blocks = parseChapterBlocks(content);
    const result: TtsChunk[] = [];

    blocks.forEach((block) => {
      const sentenceParts = splitIntoChunks(block.text);
      for (const text of sentenceParts) {
        const spokenText = cleanTextForSpeech(text);
        // Chỉ nhận mẩu có chứa ký tự chữ cái hoặc chữ số để phát âm
        if (/[\p{L}\p{N}]/u.test(spokenText)) {
          result.push({
            text,
            spokenText,
            blockIndex: block.index,
          });
        }
      }
    });

    return result;
  }, [content]);

  // Chuyển chương → đưa trạng thái về đầu ngay trong render
  if (contentKey !== content) {
    setContentKey(content);
    setStatus("idle");
    setCurrentIndex(0);
  }

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    speedRef.current = speed;
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const getAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.preservesPitch = true;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const getAudioUrl = useCallback((spokenText: string): Promise<string> => {
    const cache = audioCacheRef.current;
    const cached = cache.get(spokenText);
    if (cached) return cached;

    const promise = fetch(buildTtsUrl(spokenText))
      .then((response) => {
        if (!response.ok) throw new Error("TTS_FAILED");
        return response.blob();
      })
      .then((blob) => URL.createObjectURL(blob));

    cache.set(spokenText, promise);
    promise.catch(() => cache.delete(spokenText));

    return promise;
  }, []);

  const prefetch = useCallback(
    (index: number) => {
      const nextChunk = chunksRef.current[index];
      if (!nextChunk) return;
      getAudioUrl(nextChunk.spokenText).catch(() => {});
    },
    [getAudioUrl]
  );

  /**
   * Phát âm bằng Web Speech API dự phòng (chạy trực tiếp trên trình duyệt, không cần mạng ngoài).
   */
  const playFallbackSpeech = useCallback(
    (spokenText: string, safeIndex: number, generation: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        // Trình duyệt không hỗ trợ Web Speech -> chuyển sang câu tiếp theo sau 300ms
        setTimeout(() => {
          if (generation === generationRef.current) {
            playChunkRef.current(safeIndex + 1);
          }
        }, 300);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = "vi-VN";
        utterance.rate = speedRef.current;

        // Chọn giọng tiếng Việt nếu có sẵn trong hệ điều hành/trình duyệt
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(
          (v) => v.lang === "vi-VN" || v.lang.startsWith("vi")
        );
        if (viVoice) utterance.voice = viVoice;

        utterance.onend = () => {
          if (generation !== generationRef.current) return;
          playChunkRef.current(safeIndex + 1);
        };

        utterance.onerror = () => {
          if (generation !== generationRef.current) return;
          playChunkRef.current(safeIndex + 1);
        };

        window.speechSynthesis.speak(utterance);
        setStatus("playing");

        // Watchdog dự phòng cho Web Speech
        clearWatchdog();
        const estSeconds = Math.max(3, (spokenText.length / 12) / speedRef.current) + 2;
        watchdogTimerRef.current = setTimeout(() => {
          if (generation === generationRef.current && statusRef.current === "playing") {
            window.speechSynthesis.cancel();
            playChunkRef.current(safeIndex + 1);
          }
        }, estSeconds * 1000);
      } catch {
        if (generation === generationRef.current) {
          playChunkRef.current(safeIndex + 1);
        }
      }
    },
    [clearWatchdog]
  );

  const playChunk = useCallback(
    (index: number) => {
      clearWatchdog();
      const list = chunksRef.current;

      if (list.length === 0) {
        setStatus("idle");
        return;
      }
      if (index >= list.length) {
        setStatus("done");
        return;
      }

      const safeIndex = Math.max(0, index);
      indexRef.current = safeIndex;
      setCurrentIndex(safeIndex);

      const generation = generationRef.current;
      const currentItem = list[safeIndex];
      const spokenText = currentItem?.spokenText ?? "";

      // Nếu câu không có nội dung chữ để đọc, nhảy ngay sang câu sau
      if (!spokenText || !/[\p{L}\p{N}]/u.test(spokenText)) {
        setTimeout(() => {
          if (generation === generationRef.current) {
            playChunkRef.current(safeIndex + 1);
          }
        }, 150);
        return;
      }

      setStatus("loading");

      // Thử lấy audio chất lượng từ Google TTS trước
      getAudioUrl(spokenText)
        .then((url) => {
          if (generation !== generationRef.current) return;

          const audio = getAudioElement();
          audio.src = url;
          audio.playbackRate = speedRef.current;

          audio.onended = () => {
            clearWatchdog();
            if (generation !== generationRef.current) return;
            playChunkRef.current(safeIndex + 1);
          };

          audio.onerror = () => {
            clearWatchdog();
            if (generation !== generationRef.current) return;
            // Nếu phát MP3 lỗi, chuyển sang Web Speech fallback
            playFallbackSpeech(spokenText, safeIndex, generation);
          };

          return audio.play().then(() => {
            if (generation !== generationRef.current) return;
            setStatus("playing");
            prefetch(safeIndex + 1);

            // Thiết lập watchdog bảo vệ: Nếu audio bị đơ hoặc nuốt event onended
            const estSeconds = Math.max(3, (spokenText.length / 10) / speedRef.current) + 3;
            watchdogTimerRef.current = setTimeout(() => {
              if (generation === generationRef.current && statusRef.current === "playing") {
                audio.pause();
                playChunkRef.current(safeIndex + 1);
              }
            }, estSeconds * 1000);
          });
        })
        .catch(() => {
          if (generation !== generationRef.current) return;
          // Google TTS lỗi mạng hoặc rate limit -> Tự động dùng Web Speech API không làm ngắt chương
          playFallbackSpeech(spokenText, safeIndex, generation);
        });
    },
    [clearWatchdog, getAudioElement, getAudioUrl, playFallbackSpeech, prefetch]
  );

  useEffect(() => {
    playChunkRef.current = playChunk;
  }, [playChunk]);

  // Đổi chương → dừng phát và dọn cache âm thanh
  useEffect(() => {
    generationRef.current += 1;
    clearWatchdog();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    indexRef.current = 0;

    audioCacheRef.current.forEach((promise) => {
      promise.then((url) => URL.revokeObjectURL(url)).catch(() => {});
    });
    audioCacheRef.current.clear();
  }, [clearWatchdog, content]);

  // Dọn dẹp khi rời trang
  useEffect(() => {
    const cache = audioCacheRef.current;
    return () => {
      generationRef.current += 1;
      clearWatchdog();

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      cache.forEach((promise) => {
        promise.then((url) => URL.revokeObjectURL(url)).catch(() => {});
      });
      cache.clear();
    };
  }, [clearWatchdog]);

  const play = useCallback(() => {
    const audio = audioRef.current;

    if (statusRef.current === "paused") {
      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setStatus("playing");
        return;
      }
      if (audio && audio.src) {
        void audio
          .play()
          .then(() => setStatus("playing"))
          .catch(() => setStatus("paused"));
        return;
      }
    }

    generationRef.current += 1;
    const start = statusRef.current === "done" ? 0 : indexRef.current;
    playChunk(start);
  }, [playChunk]);

  const pause = useCallback(() => {
    clearWatchdog();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    audioRef.current?.pause();
    setStatus("paused");
  }, [clearWatchdog]);

  const stop = useCallback(() => {
    generationRef.current += 1;
    clearWatchdog();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    indexRef.current = 0;
    setCurrentIndex(0);
    setStatus("idle");
  }, [clearWatchdog]);

  /**
   * Phát từ một đoạn văn (blockIndex) do người dùng chọn trên giao diện đọc.
   */
  const playFromBlock = useCallback(
    (blockIndex: number) => {
      const list = chunksRef.current;
      if (list.length === 0) return;

      clearWatchdog();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      // Tìm mẩu đầu tiên thuộc đoạn văn này
      let targetIndex = list.findIndex((c) => c.blockIndex === blockIndex);
      if (targetIndex === -1) {
        targetIndex = list.findIndex((c) => c.blockIndex >= blockIndex);
        if (targetIndex === -1) targetIndex = 0;
      }

      generationRef.current += 1;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }

      playChunk(targetIndex);
    },
    [clearWatchdog, playChunk]
  );

  /** Chuyển sang mẩu kế tiếp. */
  const next = useCallback(() => {
    const list = chunksRef.current;
    if (indexRef.current < list.length - 1) {
      clearWatchdog();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      generationRef.current += 1;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      playChunk(indexRef.current + 1);
    }
  }, [clearWatchdog, playChunk]);

  /** Quay lại mẩu phía trước. */
  const prev = useCallback(() => {
    const target = Math.max(0, indexRef.current - 1);
    clearWatchdog();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    generationRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    playChunk(target);
  }, [clearWatchdog, playChunk]);

  const setSpeed = useCallback((value: number) => {
    setSpeedState(value);
    try {
      localStorage.setItem(STORAGE_SPEED, String(value));
    } catch {}
  }, []);

  const activeChunk = chunks[currentIndex];
  const highlighting =
    status === "playing" || status === "loading" || status === "paused";

  return {
    ready: chunks.length > 0,
    status,
    currentIndex,
    totalChunks: chunks.length,
    speed,
    activeBlockIndex: activeChunk?.blockIndex ?? -1,
    activeText: activeChunk?.text ?? "",
    highlighting,
    play,
    pause,
    stop,
    next,
    prev,
    playFromBlock,
    setSpeed,
  };
}
