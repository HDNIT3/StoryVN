"use client";

import { useState } from "react";
import Image from "next/image";

interface AuthorCoverProps {
  coverUrl?: string | null;
  penName: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function AuthorCover({ coverUrl, penName, sizes, className = "", priority }: AuthorCoverProps) {
  const src = coverUrl?.trim();
  const [failedUrl, setFailedUrl] = useState<string>();

  if (!src || src === failedUrl) return null;

  return (
    <div className={`relative aspect-[3/1] w-full ${className}`}>
      <Image
        key={src}
        src={src}
        alt={`Ảnh bìa của ${penName}`}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={() => setFailedUrl(src)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
    </div>
  );
}
