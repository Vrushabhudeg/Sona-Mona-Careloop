"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "pink" | "purple" | "green" | "none";
  hoverEffect?: boolean;
  animate?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, glowColor = "none", hoverEffect = true, animate = true, ...props }, ref) => {
    const glowClasses = {
      pink: "glass-glow-pink",
      purple: "glass-glow-purple",
      green: "glass-glow-green",
      none: "",
    };

    const cardStyles = cn(
      "glass rounded-3xl p-6 transition-all duration-300 border border-white/8 text-[#F3F1F6]",
      glowClasses[glowColor],
      hoverEffect && "bouncy-hover",
      className
    );

    if (animate) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <div ref={ref} className={cardStyles} {...props}>
            {children}
          </div>
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
