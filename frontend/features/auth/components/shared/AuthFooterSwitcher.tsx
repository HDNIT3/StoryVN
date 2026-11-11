"use client";

import React from "react";
import Link from "next/link";

export interface AuthFooterSwitcherProps {
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
    <p className="text-center text-xs sm:text-sm text-zinc-500 font-normal pt-2">
      {questionText}{" "}
      <Link
        href={href}
        className="text-sky-600 font-bold hover:text-sky-700 hover:underline transition-colors cursor-pointer ml-1"
      >
        {actionText}
      </Link>
    </p>
  );
}

export default AuthFooterSwitcher;
