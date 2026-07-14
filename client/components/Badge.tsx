import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  className?: string;
}

export default function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variantClasses = {
    primary: "bg-purple-100 text-purple-700 font-semibold",
    success: "bg-green-100 text-green-700 font-semibold",
    warning: "bg-yellow-100 text-yellow-700 font-semibold",
    danger: "bg-rose-100 text-rose-700 font-semibold",
    info: "bg-cyan-100 text-cyan-700 font-semibold",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold",
  };

  return (
    <span
    style={{padding:"5px",margin:"5px"}}
      className={`inline-block px-4 py-2 rounded-full text-xs md:text-sm font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
