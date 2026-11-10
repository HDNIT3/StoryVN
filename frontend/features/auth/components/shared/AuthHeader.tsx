"use client";

import React from "react";

export interface AuthHeaderProps {
  title: string;
  subtitle: string;
  align?: "left" | "center";
}

export function AuthHeader({ title, subtitle, align = "left" }: AuthHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`space-y-1.5 ${alignClass}`}>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
        {title}
      </h2>
      <p className="text-sm text-zinc-500 font-normal">
        {subtitle}
      </p>
    </div>
  );
}

export default AuthHeader;
