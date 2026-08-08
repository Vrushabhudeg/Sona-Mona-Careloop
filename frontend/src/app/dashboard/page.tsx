"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Plus, Flame, Clock, LogOut, Award, Smartphone, Bell, Share2, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useReminders, Reminder, ActivityLog } from "@/context/reminder-context";
import { GlassCard } from "@/components/ui/glass-card";
import { CuteReminder } from "@/components/ui/cute-reminder";
import { ReminderModal } from "@/components/ui/reminder-modal";
import { CuteSonaMonaNote } from "@/components/ui/cute-sona-mona-note";
import { AppLogo } from "@/components/ui/app-logo";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  const {
    reminders,
    logs,
    loadingReminders,
    handleAddReminder,
    handleUpdateReminder,
    handleReminderComplete,
    handleDeleteReminder,
    subscribeToPushNotifications,
  } = useReminders();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "weekly">("today");
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    }
  }, []);

  const handleEnablePush = async () => {
    setPushStatus("loading");
    setPushMessage("");
    const res = await subscribeToPushNotifications();
    if (res.success) {
      setPushStatus("success");
      setPushMessage(res.message);
      confetti({
        particleCount: 80,
        spread: 50,
        colors: ["#67E8A5", "#9B86FA"],
      });
    } else {
      setPushStatus("error");
      setPushMessage(res.message);
    }
  };

  const handleSendTestPush = async () => {
    setTestLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.post(`${API_BASE_URL}/api/notifications/send-test?user_id=${user?.id || "d3b07384-d113-4ec6-a558-7e3077dd7d7b"}`);
      alert(res.data.message || "Test push sent successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to trigger test push.");
    } finally {
      setTestLoading(false);
    }
  };

  const isPartner = user?.user_metadata?.role === "partner" || user?.email === "vrushabh@careloop.app";


  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const todayStr = new Date().toDateString();
  const todayLogs = logs.filter((l) => l.date === todayStr);

  const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const remindersToday = reminders.filter((r) => {
    if (!r.days) return true;
    const daysLower = r.days.toLowerCase();
    return daysLower.includes("daily") || daysLower.includes("everyday") || daysLower.includes(currentDay.toLowerCase());
  });

  const completedTodayCount = todayLogs.filter((l) => l.status === "completed").length;
  const progressPercent = remindersToday.length > 0 
    ? Math.min(Math.round((completedTodayCount / remindersToday.length) * 100), 100)
    : 0;

  const handleCreateReminder = async (newR: { title: string; message: string; schedule_time: string; days?: string }) => {
    if (editingReminder) {
      await handleUpdateReminder(editingReminder.id, newR);
      setEditingReminder(null);
    } else {
      await handleAddReminder(newR);
    }
    setShowAddModal(false);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowAddModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setShowAddModal(true);
  };

  // Big confetti if hitting 100% completion
  useEffect(() => {
    if (completedTodayCount > 0 && completedTodayCount === remindersToday.length) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#FF7597", "#9B86FA", "#67E8A5", "#FFD075"],
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [completedTodayCount, remindersToday.length]);

  // Dynamic Achievements list
  const achievementsList = [
    { id: "a1", name: "🌱 Seedling Step", desc: "First checked-off habit today", unlocked: completedTodayCount > 0 },
    { id: "a2", name: "💧 Super Hydrator", desc: "Drank at least 1 liter of water", unlocked: todayLogs.some(l => l.title.includes("Hydration")) },
    { id: "a3", name: "🏆 Perfect Score", desc: "Completed all reminders today!", unlocked: progressPercent === 100 },
  ];

  const monTueThuReminders = reminders.filter(r => r.days?.toLowerCase().includes("mon") || r.days?.toLowerCase().includes("tue") || r.days?.toLowerCase().includes("thu"));
  const wedFriReminders = reminders.filter(r => r.days?.toLowerCase().includes("wed") || r.days?.toLowerCase().includes("fri"));
  const otherReminders = reminders.filter(r => 
    !monTueThuReminders.some(m => m.id === r.id) && 
    !wedFriReminders.some(w => w.id === r.id)
  );

  const renderWeeklyReminderItem = (rem: Reminder) => {
    return (
      <div 
        key={rem.id}
        className={cn(
          "w-full glass rounded-2xl p-4 border relative overflow-hidden transition-all duration-300 flex items-center justify-between gap-4 border-white/5 hover:border-[#FF7597]/30",
          !rem.is_active && "opacity-55"
        )}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-2xl flex items-center justify-center bg-white/5 rounded-xl p-2 w-11 h-11 border border-white/5 shrink-0 select-none">
            {rem.emoji || "🌸"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-white font-outfit text-sm truncate">{rem.title}</h4>
              <span className="text-[9px] text-[#FF7597] bg-[#FF7597]/10 border border-[#FF7597]/20 px-2 py-0.5 rounded-full select-none font-bold uppercase">
                {rem.days}
              </span>
              <span className="text-[10px] text-[#A19AA8] bg-white/5 px-2 py-0.5 rounded font-mono">
                {rem.schedule_time}
              </span>
            </div>
            <p className="text-xs text-[#A19AA8] mt-1 truncate" title={rem.message}>{rem.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await handleUpdateReminder(rem.id, { is_active: !rem.is_active });
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border",
              rem.is_active
                ? "bg-[#67E8A5]/10 text-[#67E8A5] border-[#67E8A5]/25 hover:bg-[#67E8A5]/20"
                : "bg-white/5 text-[#A19AA8] border-white/5 hover:bg-white/10"
            )}
            title={rem.is_active ? "Pause Nudge" : "Activate Nudge"}
          >
            {rem.is_active ? "Active" : "Paused"}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditModal(rem);
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#9B86FA] hover:bg-[#9B86FA]/10 transition-all cursor-pointer flex items-center justify-center"
            title="Edit Nudge"
          >
            <Edit2 size={12} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteReminder(rem.id);
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#FF7597] hover:bg-[#FF7597]/10 transition-all cursor-pointer flex items-center justify-center"
            title="Delete Nudge"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 px-6 max-w-5xl mx-auto flex flex-col gap-8 select-none">
      
      {/* Top Navbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" />
          <span className="font-outfit font-extrabold text-lg text-white">CareLoop</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold">
          <Link href="/admin" className="text-[#A19AA8] hover:text-[#9B86FA] bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors">
            Admin Panel
          </Link>
          <Link href="/reels" className="text-[#A19AA8] hover:text-[#9B86FA] transition-colors">
            Yoga & Reels 🧘‍♀️
          </Link>
          <Link href="/nutrition" className="text-[#A19AA8] hover:text-[#FF7597] transition-colors">
            Nutrition 🍓
          </Link>
          <button 
            onClick={signOut}
            className="text-[#A19AA8] hover:text-[#FF7597] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
            Good Evening, {isPartner ? "Vrushabh" : (user?.user_metadata?.full_name || "Sona")} ❤️
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 bg-[#FF7597]/15 px-3 py-1 rounded-full text-[#FF7597] text-xs font-bold border border-[#FF7597]/10 mt-1 select-none">
              <Flame size={12} className="fill-current animate-pulse" />
              <span>{isPartner ? "Monitoring Sona's Flow" : "5 Day Streak! 🔥"}</span>
            </div>
            <p className="text-sm text-[#A19AA8] font-inter mt-1.5">
              {isPartner 
                ? "You have full caregiver control. Add, edit, or delete reminders and review her wellness progress."
                : "\"Your wellness is a quiet flower. Let it bloom at its own sweet pace today.\""
              }
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="py-3 px-6 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center gap-1.5 shadow-md cute-shadow-pink cursor-pointer"
        >
          <Plus size={16} /> Create Nudge
        </button>
      </div>

      {/* Dash Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Core Task List */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1 flex-wrap gap-2">
            <h3 className="font-bold font-outfit text-lg text-white px-1 flex items-center gap-2">
              <span>{isPartner ? "Sona's Nudges 🌸" : "Active Nudges"}</span>
              {isPartner && (
                <span className="text-[10px] text-[#9B86FA] bg-[#9B86FA]/10 border border-[#9B86FA]/20 px-2 py-0.5 rounded-full select-none font-bold uppercase">
                  Caregiver Mode
                </span>
              )}
            </h3>
            
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("today")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === "today" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
                )}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === "weekly" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
                )}
              >
                Weekly Schedule
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {loadingReminders ? (
              <div className="text-center py-8 text-xs text-[#A19AA8] animate-pulse">
                Loading active nudges... 🌸
              </div>
            ) : activeTab === "today" ? (
              remindersToday.length === 0 ? (
                <div className="text-center py-10 border border-white/5 bg-white/3 rounded-2xl text-xs text-[#A19AA8]">
                  No nudges scheduled for today! ❤️
                </div>
              ) : (
                remindersToday.map((reminder) => {
                  const isCompleted = todayLogs.some(
                    (l) => l.reminder_id === reminder.id && l.status === "completed"
                  );
                  const isReceived = todayLogs.some(
                    (l) => l.reminder_id === reminder.id && l.status === "sent"
                  );
                  return (
                    <CuteReminder
                      key={reminder.id}
                      title={reminder.title}
                      message={reminder.message}
                      emoji={reminder.emoji || "🌸"}
                      time={reminder.schedule_time}
                      days={reminder.days}
                      isReceived={isReceived}
                      isCompleted={isCompleted}
                      onComplete={() => handleReminderComplete(reminder)}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                    />
                  );
                })
              )
            ) : (
              // Weekly Schedule View
              <div className="flex flex-col gap-6">
                {/* Mon, Tue, Thu Group */}
                {monTueThuReminders.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-[#FF7597] uppercase tracking-wider px-1">
                      Monday, Tuesday, Thursday Schedule 🌸
                    </h4>
                    <div className="flex flex-col gap-3">
                      {monTueThuReminders.map((rem) => renderWeeklyReminderItem(rem))}
                    </div>
                  </div>
                )}
                
                {/* Wed, Fri Group */}
                {wedFriReminders.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-[#9B86FA] uppercase tracking-wider px-1">
                      Wednesday, Friday (Office Days) Schedule 🏢
                    </h4>
                    <div className="flex flex-col gap-3">
                      {wedFriReminders.map((rem) => renderWeeklyReminderItem(rem))}
                    </div>
                  </div>
                )}

                {/* Custom/Daily/Other Group */}
                {otherReminders.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-[#FFD075] uppercase tracking-wider px-1">
                      Custom & Daily Schedule 🌟
                    </h4>
                    <div className="flex flex-col gap-3">
                      {otherReminders.map((rem) => renderWeeklyReminderItem(rem))}
                    </div>
                  </div>
                )}

                {reminders.length === 0 && (
                  <div className="text-center py-10 border border-white/5 bg-white/3 rounded-2xl text-xs text-[#A19AA8]">
                    No reminders created yet! ❤️
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info: Daily Progress, Achievements, Activity */}
        <div className="flex flex-col gap-8">
          
          {/* iPhone 15 Notification Setup Card */}
          {!isPartner && (
            <GlassCard glowColor="pink" className="flex flex-col gap-4 border border-[#FF7597]/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#FF7597]/15 text-[#FF7597] rounded-xl border border-[#FF7597]/10">
                  <Bell size={16} />
                </div>
                <h3 className="font-bold font-outfit text-sm text-white">iPhone 15 Nudge Sync 🔔</h3>
              </div>

              {!isStandalone ? (
                <div className="space-y-3 text-xs text-[#A19AA8] leading-relaxed">
                  <p>
                    To enable automatic background reminders on your iPhone:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tap the Safari <strong>Share</strong> button at the bottom of the screen.</li>
                    <li>Select <strong>"Add to Home Screen"</strong> from the actions list.</li>
                    <li>Open this app from your Home Screen to enable native pushes.</li>
                  </ol>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#FF7597] font-semibold bg-[#FF7597]/5 p-2.5 border border-[#FF7597]/10 rounded-xl">
                    <Smartphone size={12} />
                    <span>Required for background notifications on iOS</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-[#A19AA8] leading-relaxed">
                    You have successfully added CareLoop to your Home Screen. Now configure push permissions!
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleEnablePush}
                      disabled={pushStatus === "loading"}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Bell size={13} />
                      {pushStatus === "loading" ? "Activating..." : "Allow iOS Notifications"}
                    </button>

                    <button
                      onClick={handleSendTestPush}
                      disabled={testLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#A19AA8] bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={13} />
                      {testLoading ? "Sending..." : "Send Test Alert"}
                    </button>
                  </div>

                  {pushMessage && (
                    <div className={`text-[11px] p-2.5 rounded-xl border ${
                      pushStatus === "success" 
                        ? "text-[#67E8A5] bg-[#67E8A5]/5 border-[#67E8A5]/15" 
                        : "text-[#FF7597] bg-[#FF7597]/5 border-[#FF7597]/15"
                    }`}>
                      {pushMessage}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )}

          {/* Progress Circular Panel */}
          <GlassCard glowColor="pink" className="flex flex-col items-center gap-4 text-center">
            <h3 className="font-bold font-outfit text-md text-white">
              {isPartner ? "Sona's Progress Today" : "Today's Progress"}
            </h3>
            
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
              {isPartner
                ? `Sona completed ${completedTodayCount} reminders today. Keeping her safe & healthy! ❤️`
                : `You completed ${completedTodayCount} reminders today. Stay gentle with yourself!`
              }
            </p>
          </GlassCard>

          {/* Today's Nudge Checklist Card */}
          <GlassCard glowColor="pink" className="flex flex-col gap-4 border border-[#FF7597]/25">
            <h3 className="font-bold font-outfit text-md text-white flex items-center gap-1.5">
              <span>Today's Nudge Checklist 📋</span>
            </h3>
            <div className="flex flex-col gap-2">
              {remindersToday.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#A19AA8] italic">
                  No nudges scheduled for today.
                </div>
              ) : (
                remindersToday.map((rem) => {
                  const isCompleted = todayLogs.some((l) => l.reminder_id === rem.id && l.status === "completed");
                  const isReceived = todayLogs.some((l) => l.reminder_id === rem.id && l.status === "sent");
                  
                  return (
                    <div key={rem.id} className="flex justify-between items-center text-xs p-3 bg-white/3 border border-white/5 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-white font-outfit">{rem.title}</h4>
                        <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">{rem.schedule_time}</p>
                      </div>
                      <div>
                        {isCompleted ? (
                          <span className="text-[#67E8A5] bg-[#67E8A5]/10 border border-[#67E8A5]/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Done ✅
                          </span>
                        ) : isReceived ? (
                          <span className="text-[#9B86FA] bg-[#9B86FA]/10 border border-[#9B86FA]/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(155,134,250,0.15)]">
                            Received 🔔
                          </span>
                        ) : (
                          <span className="text-[#A19AA8] bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Pending ⏳
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Achievements Card */}
          <GlassCard glowColor="purple" className="flex flex-col gap-4">
            <h3 className="font-bold font-outfit text-md text-white flex items-center gap-1.5">
              {isPartner ? "Sona's Achievements 🏆" : "Achievements 🏆"}
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
            <h3 className="font-bold font-outfit text-md text-white">
              {isPartner ? "Sona's Recent Activity" : "Recent Activity"}
            </h3>
            
            <div className="flex flex-col gap-3.5 max-h-[200px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-[#A19AA8] leading-relaxed border border-dashed border-white/5 rounded-2xl bg-white/1 select-none">
                  No activity checked off today. 🌸<br />
                  Complete your active nudges to track progress!
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-xs p-3 bg-white/3 border border-white/5 rounded-xl">
                    <div>
                      <h4 className="font-bold text-white font-outfit">{log.title}</h4>
                      <p className="text-[10px] text-[#67E8A5] font-inter mt-0.5">{log.action}</p>
                    </div>
                    <span className="text-[10px] text-[#A19AA8] flex items-center gap-1 font-medium font-inter">
                      <Clock size={10} /> {log.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Cute Personal Note for Sona-Mona */}
      <CuteSonaMonaNote />

      {/* Floating reminder creator dialog portal */}
      <ReminderModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingReminder(null);
        }}
        onSubmit={handleCreateReminder}
        editReminder={editingReminder}
      />

    </div>
  );
}
