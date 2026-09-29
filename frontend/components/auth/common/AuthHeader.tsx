"use client";

import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center space-y-1.5">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="text-xs text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
}
