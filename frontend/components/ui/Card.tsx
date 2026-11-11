import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: "default" | "glass" | "subtle";
}

export function Card({
  children,
  hoverable = false,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white border-slate-200/80 shadow-2xs",
    glass: "glass-card",
    subtle: "bg-slate-50/70 border-slate-200/60",
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${variantStyles[variant]} ${
        hoverable
          ? "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
