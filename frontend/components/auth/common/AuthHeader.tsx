"use client";

import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center space-y-1.5">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="text-sm text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}
