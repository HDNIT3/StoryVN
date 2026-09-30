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
            className={`w-full bg-white text-zinc-950 placeholder:text-zinc-400 text-base rounded-xl border transition-all duration-150 py-3 px-4 focus:outline-none focus:ring-2 ${
              leftIcon ? "pl-11" : ""
            } ${rightIcon ? "pr-11" : ""} ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-zinc-300 hover:border-zinc-400 focus:border-sky-500 focus:ring-sky-100"
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
