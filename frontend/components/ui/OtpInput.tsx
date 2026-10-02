"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  hasError = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [length, autoFocus]);

  const digits = value.split("");

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawChar = e.target.value;
    // Keep only the last character entered, ensuring it's a digit
    const char = rawChar.replace(/\D/g, "").slice(-1);

    const newDigits = [...Array(length)].map((_, i) => digits[i] || "");
    newDigits[index] = char;
    const newOtp = newDigits.join("");
    onChange(newOtp);

    // If a digit was entered, auto-focus next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box is empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...Array(length)].map((_, i) => digits[i] || "");
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);

    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 w-full">
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] || "";
        const isFilled = Boolean(char);

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            disabled={disabled}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-10 h-12 xs:w-12 xs:h-14 sm:w-14 sm:h-16 text-center text-xl xs:text-2xl sm:text-3xl font-extrabold rounded-xl sm:rounded-2xl border-2 transition-all duration-150 focus:outline-none focus:ring-4 select-none ${
              hasError
                ? "border-red-400 bg-red-50/40 text-red-700 focus:border-red-500 focus:ring-red-100"
                : isFilled
                ? "border-sky-500 bg-sky-50/40 text-zinc-950 focus:border-sky-600 focus:ring-sky-100"
                : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300 focus:border-sky-500 focus:ring-sky-100"
            } disabled:opacity-50 disabled:bg-zinc-100 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
