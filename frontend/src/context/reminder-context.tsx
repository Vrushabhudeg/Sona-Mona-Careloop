"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import axios from "axios";
import confetti from "canvas-confetti";
import { Check, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  schedule_time: string;
  emoji?: string;
  is_active: boolean;
  days?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  action: string;
  time: string;
  status?: string;
  reminder_id?: string;
  date?: string;
}

interface ReminderContextType {
  reminders: Reminder[];
  logs: ActivityLog[];
  loadingReminders: boolean;
  fetchReminders: () => Promise<void>;
  handleAddReminder: (newR: { title: string; message: string; schedule_time: string; days?: string }) => Promise<void>;
  handleUpdateReminder: (reminderId: string, updatedFields: Partial<Reminder>) => Promise<void>;
  handleReminderComplete: (reminder: Reminder) => Promise<void>;
  handleDeleteReminder: (reminderId: string) => Promise<void>;
  snoozeReminder: (reminder: Reminder) => void;
  activeNudge: Reminder | null;
  setActiveNudge: (nudge: Reminder | null) => void;
  subscribeToPushNotifications: () => Promise<{ success: boolean; message: string }>;
}

const ReminderContext = createContext<ReminderContextType>({
  reminders: [],
  logs: [],
  loadingReminders: true,
  fetchReminders: async () => {},
  handleAddReminder: async () => {},
  handleUpdateReminder: async () => {},
  handleReminderComplete: async () => {},
  handleDeleteReminder: async () => {},
  snoozeReminder: () => {},
  activeNudge: null,
  setActiveNudge: () => {},
  subscribeToPushNotifications: async () => ({ success: false, message: "" }),
});

// Double tone arpeggio synthesized chime using Web Audio API
function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };
    
    const now = ctx.currentTime;
    // Pentatonic ascending sequence (C5 -> E5 -> G5 -> C6)
    playTone(523.25, now, 1.0);
    playTone(659.25, now + 0.1, 0.9);
    playTone(783.99, now + 0.2, 0.8);
    playTone(1046.50, now + 0.35, 1.4);
  } catch (e) {
    console.warn("Failed to play audio chime:", e);
  }
}

// Parses "10:30 PM", "2:00 AM", etc. into hours24 & minutes
function parseScheduleTime(timeStr: string) {
  try {
    const cleaned = timeStr.trim();
    // Match pattern: optional leading digit, hour:minute, optional space, AM/PM
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    
    return { hours24: hours, minutes };
  } catch (e) {
    return null;
  }
}

function getEmojiForTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("water") || t.includes("hydration") || t.includes("drink")) return "💧";
  if (t.includes("fruit")) return "🍎";
  if (t.includes("dinner")) return "🍽️";
  if (t.includes("walk")) return "🚶";
  if (t.includes("sleep") || t.includes("bed")) return "🛌";
  if (t.includes("breakfast")) return "🍳";
  if (t.includes("lunch")) return "🍱";
  if (t.includes("office") || t.includes("arrival")) return "🏢";
  if (t.includes("leave") || t.includes("car")) return "🚗";
  return "🌸";
}

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [activeNudge, setActiveNudge] = useState<Reminder | null>(null);
  const [notifiedToday, setNotifiedToday] = useState<Record<string, string>>({});

  const isPartner = user?.user_metadata?.role === "partner" || user?.email === "vrushabh@careloop.app";
  const userId = isPartner ? "d3b07384-d113-4ec6-a558-7e3077dd7d7b" : (user?.id || "d3b07384-d113-4ec6-a558-7e3077dd7d7b");

  const defaultReminders: Reminder[] = [
    // Mon, Tue, Thu
    { id: "r_mon1", title: "💧 Morning Hydration", message: "Please drink lots of water to stay fresh and healthy! ❤️", schedule_time: "10:00 AM", emoji: "💧", is_active: true, days: "Mon, Tue, Thu" },
    { id: "r_mon2", title: "🍎 Evening Fruit", message: "Time to eat a plate of fresh fruit and energize yourself. 🍓", schedule_time: "04:30 PM", emoji: "🍎", is_active: true, days: "Mon, Tue, Thu" },
    { id: "r_mon3", title: "🍽️ Dinner Time", message: "Time to have dinner on time, please don't be late! Dinner is served. 🍲", schedule_time: "08:30 PM", emoji: "🍽️", is_active: true, days: "Mon, Tue, Thu" },
    { id: "r_mon4", title: "🚶 Night Walk", message: "Let's go on a gentle night walk together to clear our minds! 🌙", schedule_time: "10:30 PM", emoji: "🚶", is_active: true, days: "Mon, Tue, Thu" },
    { id: "r_mon5", title: "🛌 Time to Sleep", message: "Please go to sleep on time tonight. Sweet dreams, love! 😴", schedule_time: "12:00 AM", emoji: "🛌", is_active: true, days: "Mon, Tue, Thu" },
    // Wed, Fri
    { id: "r_wed1", title: "🍳 Healthy Breakfast", message: "Please have breakfast, don't leave on an empty stomach. 🥞", schedule_time: "10:00 AM", emoji: "🍳", is_active: true, days: "Wed, Fri" },
    { id: "r_wed2", title: "🏢 Office Arrival", message: "Hope you reached safely.. have a beautiful day you beautiful, I'm proud of you. ❤️", schedule_time: "01:00 PM", emoji: "🏢", is_active: true, days: "Wed, Fri" },
    { id: "r_wed3", title: "🍱 Office Lunch", message: "Please don't forget your lunch in your hectic meetings. Eat well! 🥗", schedule_time: "02:30 PM", emoji: "🍱", is_active: true, days: "Wed, Fri" },
    { id: "r_wed4", title: "💧 Office Hydration", message: "Please stay hydrated. Keep a water bottle close! 🥛", schedule_time: "04:00 PM", emoji: "💧", is_active: true, days: "Wed, Fri" },
    { id: "r_wed5", title: "🚗 Leave Office", message: "Hope you left the office, please be careful don't rush. I'm waiting.... and not the last but the least, I'm proud of you ❤️", schedule_time: "09:00 PM", emoji: "🚗", is_active: true, days: "Wed, Fri" },
    { id: "r_wed6", title: "🛌 Time to Sleep (Office Day)", message: "Please sleep on time tonight. Rest well! 😴", schedule_time: "12:00 AM", emoji: "🛌", is_active: true, days: "Wed, Fri" },
  ];

  // Request browser Notification permissions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.warn);
      }
    }
  }, []);

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reminders?user_id=${userId}`);
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          schedule_time: r.schedule_time,
          emoji: getEmojiForTitle(r.title),
          is_active: r.is_active,
          days: r.days || "Daily",
        }));
        setReminders(mapped);
      } else {
        setReminders(defaultReminders);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using fallback mock reminders.");
      setReminders(defaultReminders);
    } finally {
      setLoadingReminders(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reminders/history?user_id=${userId}`);
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((h: any) => {
          const matchedRem = reminders.find(r => r.id === h.reminder_id) || defaultReminders.find(r => r.id === h.reminder_id);
          const formattedTime = new Date(h.action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: h.id,
            title: matchedRem ? matchedRem.title : "Activity Done",
            action: h.status.charAt(0).toUpperCase() + h.status.slice(1),
            time: formattedTime,
            status: h.status,
            reminder_id: h.reminder_id,
            date: new Date(h.action_time).toDateString(),
          };
        });
        setLogs(mapped);
      } else {
        setLogs([]);
      }
    } catch (e) {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
    } else {
      setReminders([]);
      setLogs([]);
      setLoadingReminders(false);
    }
  }, [user, userId]);

  useEffect(() => {
    if (user && reminders.length > 0) {
      fetchLogs();
    }
  }, [user, reminders.length]);

  // Scheduler Background Loop
  useEffect(() => {
    if (!user || reminders.length === 0 || isPartner) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toDateString(); // "Mon Aug 03 2026"

      reminders.forEach((reminder) => {
        if (!reminder.is_active) return;
        const parsed = parseScheduleTime(reminder.schedule_time);
        if (!parsed) return;

        if (parsed.hours24 === currentHour && parsed.minutes === currentMinute) {
          if (notifiedToday[reminder.id] !== todayStr) {
            // Trigger alert!
            setActiveNudge(reminder);
            playChime();

            // Native browser notification (works in iOS Safari when saved to home screen or if page active)
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(reminder.title, {
                  body: reminder.message,
                  icon: "/favicon.ico",
                });
              } catch (e) {
                console.warn("Native Notification failed:", e);
              }
            }

            // Mark this reminder as notified for today
            setNotifiedToday((prev) => ({ ...prev, [reminder.id]: todayStr }));
          }
        }
      });
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [user, reminders, notifiedToday]);

  const handleAddReminder = async (newR: { title: string; message: string; schedule_time: string; days?: string }) => {
    const fresh: Reminder = {
      id: Date.now().toString(),
      title: newR.title,
      message: newR.message,
      schedule_time: newR.schedule_time,
      emoji: getEmojiForTitle(newR.title),
      is_active: true,
      days: newR.days || "Daily",
    };

    setReminders((prev) => [fresh, ...prev]);

    try {
      await axios.post(`${API_BASE_URL}/api/reminders?user_id=${userId}`, {
        title: newR.title,
        message: newR.message,
        schedule_time: newR.schedule_time,
        days: newR.days || "Daily",
        is_active: true,
      });
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#9B86FA", "#FF7597"],
      });
      await fetchReminders();
    } catch (err) {
      console.warn("Could not save new reminder to FastAPI database.");
    }
  };

  const handleUpdateReminder = async (reminderId: string, updatedFields: Partial<Reminder>) => {
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId
          ? {
              ...r,
              ...updatedFields,
              emoji: updatedFields.title ? getEmojiForTitle(updatedFields.title) : r.emoji,
            }
          : r
      )
    );

    try {
      await axios.put(`${API_BASE_URL}/api/reminders/${reminderId}`, {
        title: updatedFields.title,
        message: updatedFields.message,
        schedule_time: updatedFields.schedule_time,
        days: updatedFields.days,
        is_active: updatedFields.is_active,
      });
      await fetchReminders();
    } catch (err) {
      console.warn("Could not save updated reminder to FastAPI database.");
    }
  };

  const handleReminderComplete = async (reminder: Reminder) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add to activity feeds
    setLogs((prev) => [
      { id: Date.now().toString(), title: reminder.title, action: "Completed", time: timeStr, status: "completed", reminder_id: reminder.id, date: now.toDateString() },
      ...prev,
    ]);

    // Celebrate with confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ["#FF7597", "#9B86FA", "#67E8A5", "#FFD075"],
    });

    try {
      await axios.post(`${API_BASE_URL}/api/reminders/history`, {
        reminder_id: reminder.id,
        user_id: userId,
        status: "completed",
        action_time: new Date().toISOString()
      });
      await fetchLogs();
    } catch (err) {
      console.warn("Could not log completion to backend DB.");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    try {
      await axios.delete(`${API_BASE_URL}/api/reminders/${reminderId}`);
    } catch (e) {
      console.warn("Could not delete reminder from backend database.");
    }
  };

  const snoozeReminder = (reminder: Reminder) => {
    // Dismiss active nudge and schedule a re-alert in 10 seconds for user demonstration
    setActiveNudge(null);
    setTimeout(() => {
      setActiveNudge(reminder);
      playChime();
    }, 10000);
  };

  const subscribeToPushNotifications = async (): Promise<{ success: boolean; message: string }> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { success: false, message: "Notifications are not supported on this browser version." };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { success: false, message: "Permission not granted. Please allow notifications in iOS Settings -> Safari." };
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = "BD0vydkCgyWGPEJ_hqZqIdUuAtPSvf7dpQnemf372NYY2GZI0hxyKDqq1kHoj_a6zOUSnQrSd0v229JAbEkV-bY";
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subJSON = subscription.toJSON();
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        return { success: false, message: "Web Push subscription payload is incomplete." };
      }

      await axios.post(`${API_BASE_URL}/api/notifications/subscribe`, {
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      });

      return { success: true, message: "Notifications successfully enabled! ❤️" };
    } catch (err: any) {
      console.warn("Subscription creation error:", err);
      return { success: false, message: err.message || "Failed to set up push notifications." };
    }
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        logs,
        loadingReminders,
        fetchReminders,
        handleAddReminder,
        handleUpdateReminder,
        handleReminderComplete,
        handleDeleteReminder,
        snoozeReminder,
        activeNudge,
        setActiveNudge,
        subscribeToPushNotifications,
      }}
    >
      {children}

      {/* Floating active nudge banner at the top of the viewport */}
      <AnimatePresence>
        {activeNudge && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="pointer-events-auto w-full glass rounded-3xl p-5 border border-[#FF7597]/30 bg-[#14121F]/90 backdrop-blur-md shadow-2xl glass-glow-pink flex flex-col gap-4"
            >
              <div className="flex gap-4">
                <div className="text-2xl bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] text-white w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-md select-none shrink-0 animate-bounce">
                  🔔
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-white text-base font-outfit flex items-center gap-1">
                      CareLoop Nudge 🌸
                    </h3>
                    <span className="text-[10px] text-[#FF7597] bg-[#FF7597]/10 font-bold border border-[#FF7597]/20 px-2 py-0.5 rounded-full select-none">
                      {activeNudge.schedule_time}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm font-outfit mt-1.5">{activeNudge.title}</h4>
                  <p className="text-xs text-[#A19AA8] mt-1 leading-relaxed font-inter">{activeNudge.message}</p>
                </div>
              </div>
              
              <div className="flex gap-2 border-t border-white/5 pt-3 mt-1">
                <button
                  onClick={async () => {
                    await handleReminderComplete(activeNudge);
                    setActiveNudge(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer shadow-md cute-shadow-pink"
                >
                  <Check size={12} />
                  Complete
                </button>
                <button
                  onClick={() => {
                    snoozeReminder(activeNudge);
                  }}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-[#FFD075] bg-[#FFD075]/10 border border-[#FFD075]/20 hover:bg-[#FFD075]/25 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1"
                >
                  <BellRing size={12} />
                  Snooze
                </button>
                <button
                  onClick={() => setActiveNudge(null)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-[#A19AA8] hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ReminderContext.Provider>
  );
};

export const useReminders = () => useContext(ReminderContext);
