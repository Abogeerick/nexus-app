"use client";

import { motion } from "framer-motion";

interface ButtonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function ButtonLoader({ size = "md", text }: ButtonLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`${sizeClasses[size]} border-2 border-white/30 border-t-white rounded-full`}
      />
      {text && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium"
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}

