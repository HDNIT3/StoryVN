"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractContentBlocks } from "@/lib/utils/htmlToPlainText";

export type TtsStatus = "idle" | "loading" | "playing" | "paused" | "done";

/** Các mức tốc độ cho phép. */
export const TTS_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Số ký tự tối đa mỗi mẩu đọc (Google TTS giới hạn ~200 ký tự / request).
 */
const MAX_CHUNK_LENGTH = 170;
const STORAGE_SPEED = "reader_tts_speed";

interface TtsChunk {
  text: string;
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
  setSpeed: (speed: number) => void;
}

function splitIntoChunks(text: string): string[] {
  if (!text) return [];

  const sentences = text.match(/[^.!?…:;\n]+[.!?…:;]*\n?/g) ?? [text];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    let rest = sentence.trim();
    if (!rest) continue;

    while (rest.length > MAX_CHUNK_LENGTH) {
      let cut = rest.lastIndexOf(" ", MAX_CHUNK_LENGTH);
      if (cut < 40) cut = MAX_CHUNK_LENGTH;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }

    if (rest) chunks.push(rest);
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
 * Đọc nội dung chương bằng giọng tiếng Việt lấy từ `/api/tts`.
 *
 * Vì mỗi mẩu là một file mp3 riêng nên hook tự tải trước mẩu kế tiếp để
 * việc đọc liền mạch, đồng thời giữ tốc độ phát bằng `playbackRate`
 * (x1, x1.5...) mà không làm đổi cao độ giọng.
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
  /** text -> Promise<blob url> (đã tải xong hoặc đang tải). */
  const audioCacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const playChunkRef = useRef<(index: number) => void>(() => {});

  const chunks = useMemo(() => {
    const blocks = extractContentBlocks(content);
    const result: TtsChunk[] = [];

    blocks.forEach((block, blockIndex) => {
      for (const text of splitIntoChunks(block)) {
        result.push({ text, blockIndex });
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

  const getAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      // Giữ nguyên cao độ khi tua nhanh (x1.5 vẫn nghe tự nhiên)
      audio.preservesPitch = true;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const getAudioUrl = useCallback((text: string): Promise<string> => {
    const cache = audioCacheRef.current;
    const cached = cache.get(text);
    if (cached) return cached;

    const promise = fetch(buildTtsUrl(text))
      .then((response) => {
        if (!response.ok) throw new Error("TTS_FAILED");
        return response.blob();
      })
      .then((blob) => URL.createObjectURL(blob));

    cache.set(text, promise);
    // Lỗi thì xoá khỏi cache để lần sau thử lại
    promise.catch(() => cache.delete(text));

    return promise;
  }, []);

  const prefetch = useCallback(
    (index: number) => {
      const next = chunksRef.current[index];
      if (!next) return;
      getAudioUrl(next.text).catch(() => {});
    },
    [getAudioUrl]
  );

  const playChunk = useCallback(
    (index: number) => {
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
      const text = list[safeIndex].text;

      setStatus("loading");

      getAudioUrl(text)
        .then((url) => {
          if (generation !== generationRef.current) return;

          const audio = getAudioElement();
          audio.src = url;
          audio.playbackRate = speedRef.current;

          audio.onended = () => {
            if (generation !== generationRef.current) return;
            playChunkRef.current(safeIndex + 1);
          };
          audio.onerror = () => {
            if (generation !== generationRef.current) return;
            playChunkRef.current(safeIndex + 1);
          };

          return audio.play().then(() => {
            if (generation !== generationRef.current) return;
            setStatus("playing");
            prefetch(safeIndex + 1);
          });
        })
        .catch(() => {
          if (generation !== generationRef.current) return;
          // Mất mạng / dịch vụ lỗi → dừng ở mẩu hiện tại để người dùng bấm lại
          setStatus("idle");
        });
    },
    [getAudioElement, getAudioUrl, prefetch]
  );

  useEffect(() => {
    playChunkRef.current = playChunk;
  }, [playChunk]);

  // Đổi chương → dừng phát và dọn cache âm thanh
  useEffect(() => {
    generationRef.current += 1;

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
  }, [content]);

  // Dọn dẹp khi rời trang
  useEffect(() => {
    const cache = audioCacheRef.current;
    return () => {
      generationRef.current += 1;
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
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;

    if (statusRef.current === "paused" && audio && audio.src) {
      void audio
        .play()
        .then(() => setStatus("playing"))
        .catch(() => setStatus("paused"));
      return;
    }

    generationRef.current += 1;
    const start = statusRef.current === "done" ? 0 : indexRef.current;
    playChunk(start);
  }, [playChunk]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    indexRef.current = 0;
    setCurrentIndex(0);
    setStatus("idle");
  }, []);

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
    setSpeed,
  };
}
