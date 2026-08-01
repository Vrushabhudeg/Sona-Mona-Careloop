"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; message: string; schedule_time: string }) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [time, setTime] = useState("08:00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Client-side AI Simulation for generating heartwarming nudges
  const handleAIGenerate = () => {
    if (!title.trim()) {
      setMessage("Please type a title first, and I will generate a cute nudge for you! 🌸");
      return;
    }

    const t = title.toLowerCase();
    let generated = "";

    if (t.includes("water") || t.includes("drink") || t.includes("hydrate")) {
      generated = "Hydration check! 💧 Taking a small sip of refreshing cold water works wonders for your energy and keeps you glowing. Drink up! ❤️";
    } else if (t.includes("walk") || t.includes("stroll") || t.includes("step")) {
      generated = "Walk break! 🚶 A soft, gentle 15-minute walk will clear your thoughts, refresh your lungs, and help you sleep like a baby. Let's step out! 🌸";
    } else if (t.includes("sleep") || t.includes("bed") || t.includes("rest") || t.includes("night")) {
      generated = "Cozy time is here! 🌙 Let's wind down, set your screen aside, and slip into some sweet dreams. You did amazing today. Goodnight! 🧸";
    } else if (t.includes("stretch") || t.includes("move") || t.includes("exercise") || t.includes("yoga")) {
      generated = "Stretch session! 🤸 Let's shake off the desk stiffness with a 5-minute stretch. Move gently and feel the positive energy flow. You've got this! ✨";
    } else if (t.includes("read") || t.includes("book") || t.includes("study")) {
      generated = "Reading corner! 📖 Flip open your favorite book for 10 quiet pages. A little escape is just what you need to refresh your sparkle. 🍃";
    } else {
      generated = `gentle reminder: It is time for your "${title}". Take a soft breath, do this action with love, and celebrate your progress! You are doing great! ❤️`;
    }

    setMessage(generated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      message: message.trim(),
      schedule_time: `${time} ${period}`,
    });

    setTitle("");
    setMessage("");
    setTime("08:00");
    setPeriod("AM");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-6 z-10 shadow-2xl relative bg-[#14121F]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-outfit text-white flex items-center gap-1.5">
                🌸 Create Cute Reminder
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#A19AA8] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Take a Water Break 💧"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                    Sweet Message Nudge
                  </label>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    className="text-[10px] font-bold text-[#FF7597] hover:text-[#FF7597]/80 hover:underline flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    ✨ Generate Cute AI Message
                  </button>
                </div>
                <textarea
                  placeholder="e.g., A tiny cup of cold water works magic. Take a sip!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 10:30"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                    AM / PM
                  </label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPeriod("AM")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                        period === "AM" ? "bg-[#FF7597] text-white" : "text-[#A19AA8] hover:text-white"
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod("PM")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                        period === "PM" ? "bg-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-md cute-shadow-pink"
              >
                <Sparkles size={12} />
                Create Reminder
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
