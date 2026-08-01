"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface CuteReminderProps {
  title: string;
  message: string;
  emoji?: string;
  time: string;
  days?: string;
  onComplete?: () => void;
  onSnooze?: () => void;
}

export const CuteReminder: React.FC<CuteReminderProps> = ({
  title,
  message,
  emoji = "🌸",
  time,
  days,
  onComplete,
  onSnooze,
}) => {
  const [status, setStatus] = useState<"pending" | "completed" | "snoozed">("pending");

  const handleComplete = () => {
    setStatus("completed");
    
    // Trigger colorful confetti celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#FF7597", "#9B86FA", "#67E8A5", "#FFD075"],
    });

    if (onComplete) onComplete();
  };

  const handleSnooze = () => {
    setStatus("snoozed");
    if (onSnooze) onSnooze();
    
    // Automatically reset to pending after 5 seconds to showcase repeat interaction
    setTimeout(() => {
      setStatus("pending");
    }, 5000);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "w-full glass rounded-2xl p-5 border relative overflow-hidden transition-all duration-300",
          status === "completed" && "border-[#67E8A5]/40 bg-[#67E8A5]/5 glass-glow-green",
          status === "snoozed" && "border-[#FFD075]/40 bg-[#FFD075]/5",
          status === "pending" && "border-white/10 glass-glow-pink hover:border-[#FF7597]/40"
        )}
      >
        <div className="flex gap-4">
          <div className="text-3xl flex items-center justify-center bg-white/5 rounded-2xl p-3 w-14 h-14 border border-white/5 select-none">
            {emoji}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg text-white font-outfit flex items-center gap-1.5">
                {title}
                {status === "completed" && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="text-[#67E8A5] text-xs bg-[#67E8A5]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-sans"
                  >
                    <Check size={10} /> Done!
                  </motion.span>
                )}
              </h3>
              <div className="flex gap-1.5 items-center">
                {days && (
                  <span className="text-[9px] text-[#FF7597] bg-[#FF7597]/10 border border-[#FF7597]/25 px-2 py-0.5 rounded-full font-bold select-none uppercase">
                    {days}
                  </span>
                )}
                <span className="text-xs text-[#A19AA8] bg-white/5 px-2 py-1 rounded-md">
                  {time}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#A19AA8] mt-1 leading-relaxed">{message}</p>

            {status === "pending" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mt-4"
              >
                <button
                  onClick={handleComplete}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md cute-shadow-pink"
                >
                  <Sparkles size={12} />
                  Completed
                </button>
                <button
                  onClick={handleSnooze}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-[#A19AA8] bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  Snooze
                </button>
              </motion.div>
            )}

            {status === "snoozed" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[#FFD075] mt-3 flex items-center gap-1 font-medium"
              >
                <BellRing size={12} className="animate-bounce" /> Snoozed! Will nudge you again in a bit...
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
