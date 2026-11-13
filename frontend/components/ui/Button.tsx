import React, { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const variantClasses = {
      primary:
        "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 active:from-sky-700 active:to-indigo-800 text-white shadow-sm shadow-sky-500/25 hover:shadow-md hover:shadow-sky-500/30 focus-visible:ring-sky-500",
      secondary:
        "bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-800 border border-slate-200/60 focus-visible:ring-slate-400",
      outline:
        "border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs focus-visible:ring-sky-400",
      ghost:
        "bg-transparent hover:bg-slate-100/80 active:bg-slate-200/60 text-slate-700 hover:text-slate-950 focus-visible:ring-slate-400",
      danger:
        "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:from-rose-700 active:to-red-800 text-white shadow-sm shadow-rose-500/25 focus-visible:ring-rose-500",
      success:
        "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 text-white shadow-sm shadow-emerald-500/25 focus-visible:ring-emerald-500",
    };

    const sizeClasses = {
      sm: "text-xs sm:text-sm px-3.5 py-1.5 sm:py-2 gap-1.5 sm:gap-2 font-semibold",
      md: "text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 gap-2 font-bold",
      lg: "text-base sm:text-lg px-6 sm:px-7 py-3 sm:py-3.5 gap-2.5 font-bold rounded-2xl",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
