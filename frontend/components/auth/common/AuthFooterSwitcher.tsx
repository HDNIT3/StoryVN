"use client";

import React from "react";
import Link from "next/link";

interface AuthFooterSwitcherProps {
  questionText: string;
  actionText: string;
  href: string;
}

export function AuthFooterSwitcher({
  questionText,
  actionText,
  href,
}: AuthFooterSwitcherProps) {
  return (
    <p className="text-center text-xs text-zinc-500">
      {questionText}{" "}
      <Link
        href={href}
        className="text-orange-600 font-semibold hover:underline cursor-pointer"
      >
        {actionText}
      </Link>
    </p>
  );
}
