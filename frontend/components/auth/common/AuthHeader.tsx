"use client";

import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}
