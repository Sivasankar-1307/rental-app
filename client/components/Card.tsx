import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}

export default function Card({ children, className = "", hover = true, style }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-500 overflow-hidden ${
        hover ? "hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2" : ""
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

