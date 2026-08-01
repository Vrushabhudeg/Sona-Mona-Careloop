"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";
import confetti from "canvas-confetti";

export const CuteSonaMonaNote = () => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.85 },
      colors: ["#FF7597", "#9B86FA", "#67E8A5", "#FFD075"],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-4xl mx-auto my-12 px-6 w-full"
    >
      <div 
        onClick={triggerConfetti}
        className="cursor-pointer relative overflow-hidden rounded-[2.5rem] border border-[#FF7597]/20 bg-gradient-to-br from-[#14121F]/90 via-[#221A35]/80 to-[#14121F]/90 p-8 md:p-12 shadow-2xl glass-glow-pink transition-all duration-500 hover:scale-[1.02] group select-none"
      >
        {/* Interactive Glowing blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 rounded-full bg-[#FF7597]/15 blur-3xl pointer-events-none group-hover:bg-[#FF7597]/25 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-56 h-56 rounded-full bg-[#9B86FA]/15 blur-3xl pointer-events-none group-hover:bg-[#9B86FA]/25 transition-all duration-700" />

        {/* Cute floating emojis/symbols with custom animation delays */}
        <div className="absolute top-6 left-8 text-xl animate-bounce pointer-events-none select-none">✨</div>
        <div className="absolute bottom-6 right-8 text-xl animate-bounce pointer-events-none select-none" style={{ animationDelay: "1s" }}>💖</div>
        <div className="absolute top-8 right-12 text-lg animate-pulse pointer-events-none select-none opacity-50">🌸</div>
        <div className="absolute bottom-8 left-12 text-lg animate-pulse pointer-events-none select-none opacity-50" style={{ animationDelay: "0.5s" }}>⭐</div>

        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.12, 1],
              rotate: [0, 8, -8, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              ease: "easeInOut" 
            }}
            className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] flex items-center justify-center text-4xl shadow-lg cute-shadow-pink mb-8 border border-white/10"
          >
            ❤️
          </motion.div>

          <h2 className="font-outfit font-black text-3xl md:text-4xl bg-gradient-to-r from-[#FF7597] via-[#FFD075] to-[#9B86FA] bg-clip-text text-transparent mb-6 tracking-tight flex items-center gap-2 select-none">
            Listen Sona-Mona ❤️✨
          </h2>

          <p className="text-base md:text-lg text-[#F3F1F6]/90 font-inter leading-relaxed max-w-2xl mb-8 font-medium">
            You are beautiful the way you are, due to this PCOD sometimes you might get facial hair, exceed the weight, pimples acne etc. <br />
            but listen you are always loved and you are beautiful with all of these above so be yourself.
          </p>

          <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-[#FF7597]/30 to-transparent my-2" />

          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl bg-[#FF7597]/10 hover:bg-[#FF7597]/15 border border-[#FF7597]/20 text-white font-outfit font-bold text-sm transition-all duration-300 shadow-md group-hover:cute-shadow-pink"
          >
            <Sparkles size={16} className="text-[#FFD075] animate-spin" style={{ animationDuration: '6s' }} />
            Let's improve the lifestyle together 🌸✨
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
