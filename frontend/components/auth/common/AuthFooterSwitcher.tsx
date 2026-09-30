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
    <p className="text-center text-sm sm:text-base text-zinc-500">
      {questionText}{" "}
      <Link
        href={href}
        className="text-sky-600 font-bold hover:underline cursor-pointer"
      >
        {actionText}
      </Link>
    </p>
  );
}
