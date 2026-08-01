"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Plus, Flame, Clock, LogOut, Award } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import { CuteReminder } from "@/components/ui/cute-reminder";
import { ReminderModal } from "@/components/ui/reminder-modal";
import { CuteSonaMonaNote } from "@/components/ui/cute-sona-mona-note";
import axios from "axios";
import confetti from "canvas-confetti";

interface Reminder {
  id: string;
  title: string;
  message: string;
  schedule_time: string;
  emoji?: string;
  is_active: boolean;
  days?: string;
}

interface ActivityLog {
  id: string;
  title: string;
  action: string;
  time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const userId = user?.id || "d3b07384-d113-4ec6-a558-7e3077dd7d7b";

  // Pre-fill mock data for initial load/fallback
  const defaultReminders: Reminder[] = [
    { id: "r1", title: "🏃 Night Walk", message: "Time for a gentle walk at night to clear your mind. 🌙", schedule_time: "10:00 PM", emoji: "🏃", is_active: true, days: "Daily" },
    { id: "r2", title: "🛌 Time to Sleep", message: "Time to sleep! Sleep tight, Sona. 😴", schedule_time: "12:00 AM", emoji: "🛌", is_active: true, days: "Daily" },
    { id: "r3", title: "🏢 WFO Meal & Hydration", message: "Don't skip meals in between meetings. Stay hydrated, and come home waiting... ❤️", schedule_time: "02:30 PM", emoji: "🏢", is_active: true, days: "Wed, Fri" },
  ];

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/reminders?user_id=${userId}`);
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          schedule_time: r.schedule_time,
          emoji: r.title.toLowerCase().includes("walk") ? "🏃" : r.title.toLowerCase().includes("sleep") ? "🛌" : "🏢",
          is_active: r.is_active,
          days: r.title.toLowerCase().includes("wfo") || r.title.toLowerCase().includes("office") ? "Wed, Fri" : "Daily",
        }));
        setReminders(mapped);
      } else {
        setReminders(defaultReminders);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using fallback mock reminders.");
      setReminders(defaultReminders);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    // Set default recent logs
    setLogs([
      { id: "l1", title: "🏃 Night Walk", action: "Completed", time: "10:14 PM" },
      { id: "l2", title: "🏢 WFO Meal & Hydration", action: "Completed", time: "02:42 PM" },
    ]);
  }, [userId]);

  // Log completion to DB
  const handleReminderComplete = async (reminder: Reminder) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nextLogs = [
      { id: Date.now().toString(), title: reminder.title, action: "Completed", time: timeStr },
      ...logs,
    ];
    setLogs(nextLogs);

    // Calculate progress with the new log count
    const nextCompletedCount = nextLogs.filter(l => l.action === "Completed").length;
    const totalCount = reminders.length || 4;
    
    // Big confetti if hitting 100% completion
    if (nextCompletedCount >= totalCount) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#FF7597", "#9B86FA", "#67E8A5", "#FFD075"],
        });
      }, 300);
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/reminders/history", {
        reminder_id: reminder.id,
        user_id: userId,
        status: "completed",
        action_time: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Could not log completion to backend DB.");
    }
  };

  // Add reminder helper
  const handleAddReminder = async (newR: { title: string; message: string; schedule_time: string }) => {
    const fresh: Reminder = {
      id: Date.now().toString(),
      title: newR.title,
      message: newR.message,
      schedule_time: newR.schedule_time,
      emoji: "🌸",
      is_active: true,
    };

    setReminders((prev) => [fresh, ...prev]);
    setShowAddModal(false);

    try {
      await axios.post(`http://127.0.0.1:8000/api/reminders?user_id=${userId}`, {
        title: newR.title,
        message: newR.message,
        schedule_time: newR.schedule_time,
        is_active: true,
      });
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#9B86FA", "#FF7597"],
      });
    } catch (err) {
      console.warn("Could not save new reminder to FastAPI database.");
    }
  };

  const completedCount = logs.filter(l => l.action === "Completed").length;
  const progressPercent = Math.min(Math.round((completedCount / (reminders.length || 4)) * 100), 100);

  // Dynamic Achievements list
  const achievementsList = [
    { id: "a1", name: "🌱 Seedling Step", desc: "First checked-off habit today", unlocked: completedCount > 0 },
    { id: "a2", name: "💧 Super Hydrator", desc: "Drank at least 1 liter of water", unlocked: logs.some(l => l.title.includes("Hydration")) },
    { id: "a3", name: "🏆 Perfect Score", desc: "Completed all reminders today!", unlocked: progressPercent === 100 },
  ];

  return (
    <div className="min-h-screen py-10 px-6 max-w-5xl mx-auto flex flex-col gap-8 select-none">
      
      {/* Top Navbar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] flex items-center justify-center text-white text-sm font-bold shadow-md">
            ❤️
          </div>
          <span className="font-outfit font-extrabold text-lg text-white">CareLoop</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs text-[#A19AA8] hover:text-[#9B86FA] transition-colors font-semibold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            Admin Panel
          </Link>
          <Link href="/nutrition" className="text-xs text-[#A19AA8] hover:text-[#FF7597] transition-colors font-semibold">
            Nutrition 🍓
          </Link>
          <button 
            onClick={signOut}
            className="text-xs text-[#A19AA8] hover:text-[#FF7597] flex items-center gap-1 transition-colors font-semibold cursor-pointer"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
            Good Evening, {user?.user_metadata?.full_name || "Sona"} ❤️
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 bg-[#FF7597]/15 px-3 py-1 rounded-full text-[#FF7597] text-xs font-bold border border-[#FF7597]/10 mt-1 select-none">
              <Flame size={12} className="fill-current animate-pulse" />
              <span>5 Day Streak! 🔥</span>
            </div>
            <p className="text-sm text-[#A19AA8] font-inter mt-1.5">
              "Your wellness is a quiet flower. Let it bloom at its own sweet pace today."
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-6 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center gap-1.5 shadow-md cute-shadow-pink cursor-pointer"
        >
          <Plus size={16} /> Create Reminder
        </button>
      </div>

      {/* Dash Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Core Task List */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold font-outfit text-lg text-white px-1">Active Nudges</h3>
          <div className="flex flex-col gap-4">
            {reminders.map((reminder) => (
              <CuteReminder
                key={reminder.id}
                title={reminder.title}
                message={reminder.message}
                emoji={reminder.emoji || "🌸"}
                time={reminder.schedule_time}
                days={reminder.days}
                onComplete={() => handleReminderComplete(reminder)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Info: Daily Progress, Achievements, Activity */}
        <div className="flex flex-col gap-8">
          
          {/* Progress Circular Panel */}
          <GlassCard glowColor="pink" className="flex flex-col items-center gap-4 text-center">
            <h3 className="font-bold font-outfit text-md text-white">Today's Progress</h3>
            
            <div className="relative w-32 h-32 flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="50" className="stroke-white/5" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="50"
                  className="stroke-[#FF7597]"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="314"
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 - (314 * progressPercent) / 100 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-outfit">{progressPercent}%</span>
                <span className="text-[10px] text-[#A19AA8] font-inter uppercase font-semibold">Goal Rate</span>
              </div>
            </div>
            
            <p className="text-xs text-[#A19AA8] font-inter leading-relaxed">
              You completed <span className="text-[#FF7597] font-bold">{completedCount}</span> reminders today. Stay gentle with yourself!
            </p>
          </GlassCard>

          {/* Achievements Card */}
          <GlassCard glowColor="purple" className="flex flex-col gap-4">
            <h3 className="font-bold font-outfit text-md text-white flex items-center gap-1.5">
              Achievements 🏆
            </h3>
            <div className="flex flex-col gap-3">
              {achievementsList.map((ach) => (
                <div 
                  key={ach.id} 
                  className={`flex gap-3 text-xs p-3 rounded-2xl border transition-all duration-300 ${
                    ach.unlocked 
                      ? "bg-[#67E8A5]/5 border-[#67E8A5]/25" 
                      : "bg-white/3 border-white/5 opacity-55"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-sm ${
                    ach.unlocked 
                      ? "bg-[#67E8A5]/10 border-[#67E8A5]/20 text-[#67E8A5]" 
                      : "bg-white/5 border-white/5 text-[#A19AA8]"
                  }`}>
                    <Award size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white font-outfit">{ach.name}</h4>
                    <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Activity Feed */}
          <GlassCard glowColor="none" className="flex flex-col gap-4">
            <h3 className="font-bold font-outfit text-md text-white">Recent Activity</h3>
            
            <div className="flex flex-col gap-3.5 max-h-[200px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center text-xs p-3 bg-white/3 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-bold text-white font-outfit">{log.title}</h4>
                    <p className="text-[10px] text-[#67E8A5] font-inter mt-0.5">{log.action}</p>
                  </div>
                  <span className="text-[10px] text-[#A19AA8] flex items-center gap-1 font-medium font-inter">
                    <Clock size={10} /> {log.time}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Cute Personal Note for Sona-Mona */}
      <CuteSonaMonaNote />

      {/* Floating reminder creator dialog portal */}
      <ReminderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddReminder}
      />

    </div>
  );
}
