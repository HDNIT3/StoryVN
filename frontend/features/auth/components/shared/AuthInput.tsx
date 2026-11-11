"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);

    return (
      <div className={`w-full flex flex-col ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-zinc-700 tracking-wider mb-1.5 select-none min-h-[18px] leading-tight"
          >
            {label} {required && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative rounded-xl shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`block w-full py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white text-zinc-900 placeholder:text-zinc-400 text-sm font-medium rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${rightIcon ? "pr-10" : "pr-3.5"} ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-zinc-200/90 hover:border-zinc-300 focus:border-sky-500 focus:ring-sky-500/20"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-[11px] text-zinc-500 font-normal leading-normal">{helperText}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;

