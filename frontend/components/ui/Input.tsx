import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
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
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`w-full flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[15px] font-semibold text-zinc-900 select-none flex items-center justify-between"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 flex items-center pointer-events-none text-zinc-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base rounded-xl border transition-all duration-150 py-2.5 sm:py-3 px-3.5 sm:px-4 shadow-2xs focus:outline-none ${
              leftIcon ? "pl-11" : ""
            } ${rightIcon ? "pr-11" : ""} ${
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-900"
                : "border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 flex items-center text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
        {!error && helperText && (
          <span className="text-sm text-zinc-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
