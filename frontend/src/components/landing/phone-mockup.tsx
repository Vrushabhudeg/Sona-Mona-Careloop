"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface Task {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
}

export const PhoneMockup: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", name: "Walk 20m", emoji: "🏃", completed: false },
    { id: "2", name: "Drink Water", emoji: "💧", completed: true },
    { id: "3", name: "Read 10m", emoji: "📖", completed: true },
    { id: "4", name: "Sleep Well", emoji: "😴", completed: false },
  ]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            // Trigger a mini confetti splash inside the phone viewport area
            confetti({
              particleCount: 30,
              spread: 50,
              origin: { x: 0.5, y: 0.5 },
              colors: ["#FF7597", "#9B86FA", "#67E8A5"],
            });
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  return (
    <div className="w-[310px] h-[610px] rounded-[50px] border-4 border-white/10 glass p-3 relative shadow-2xl flex flex-col overflow-hidden select-none mx-auto lg:mx-0">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0B0A0F] rounded-b-2xl z-20 flex items-center justify-center border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10 absolute left-6"></div>
        <div className="w-10 h-1 bg-white/15 rounded-full"></div>
      </div>

      {/* Internal Phone Screen Container */}
      <div className="flex-1 flex flex-col pt-8 pb-4 px-3 justify-between bg-gradient-to-b from-[#14121F] to-[#0B0A0F] rounded-[38px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mt-2 px-1">
          <div>
            <h4 className="text-[10px] text-[#A19AA8] font-medium font-inter">Welcome back</h4>
            <h3 className="text-base font-bold text-white font-outfit mt-0.5 flex items-center gap-1">
              Sona ❤️
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-[#FF7597]/15 px-2.5 py-1 rounded-full text-[#FF7597] text-[10px] font-semibold">
            <Flame size={10} className="fill-current animate-pulse" />
            <span>5 Days</span>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="flex flex-col items-center my-3 glass rounded-2xl p-3 border border-white/5 relative overflow-hidden bg-white/2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-white/5"
                strokeWidth="6"
                fill="transparent"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-[#FF7597]"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="226"
                initial={{ strokeDashoffset: 226 }}
                animate={{ strokeDashoffset: 226 - (226 * progressPercent) / 100 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white font-outfit">{progressPercent}%</span>
              <span className="text-[9px] text-[#A19AA8] font-inter">Progress</span>
            </div>
          </div>
          {progressPercent === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-[#67E8A5]/10 backdrop-blur-md flex flex-col items-center justify-center gap-1 p-2 text-center"
            >
              <Trophy size={24} className="text-[#67E8A5] animate-bounce" />
              <span className="text-[11px] font-bold text-white font-outfit">Perfect Day! 🎉</span>
            </motion.div>
          )}
        </div>

        {/* Tasks list */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 mt-1">
          <h4 className="text-[10px] text-[#A19AA8] uppercase tracking-wider font-semibold font-inter mb-1 px-1">
            Today's Habits
          </h4>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                task.completed
                  ? "bg-[#9B86FA]/10 border-[#9B86FA]/30"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{task.emoji}</span>
                <span
                  className={`text-[11px] font-medium font-outfit transition-all duration-200 ${
                    task.completed ? "line-through text-[#A19AA8]" : "text-white"
                  }`}
                >
                  {task.name}
                </span>
              </div>
              <div
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all duration-200 ${
                  task.completed
                    ? "bg-[#9B86FA] border-[#9B86FA] text-white"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {task.completed && <Check size={10} strokeWidth={3} />}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Interactive Reminder Banner */}
        <div className="mt-3 bg-gradient-to-r from-[#FF7597]/15 to-[#9B86FA]/15 border border-[#FF7597]/25 rounded-xl p-2.5 flex gap-2 items-center">
          <div className="text-lg">💧</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-bold text-white font-outfit truncate">Time for Water</h4>
            <p className="text-[9px] text-[#A19AA8] truncate">Nudge: A healthy sip works wonders!</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF7597] animate-ping"></div>
        </div>

      </div>
    </div>
  );
};
