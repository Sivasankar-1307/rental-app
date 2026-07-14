"use client";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-2xl";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 active:scale-95",
    secondary:
      "bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 hover:-translate-y-1",
    outline:
      "border-2 border-primary text-primary hover:bg-primary/5 shadow-sm hover:-translate-y-1",
    ghost:
      "text-gray-500 hover:text-primary hover:bg-primary/5",
    danger:
      "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 hover:-translate-y-1",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-10 py-4 text-sm",
    xl: "px-12 py-5 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center">
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

