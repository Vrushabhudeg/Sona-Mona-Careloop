"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Bell, BarChart2, Shield, Search, Send, Clock, Sparkles, Edit2, Check, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import axios from "axios";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  reminders_count: number;
  joined: string;
}

interface AdminReminder {
  id: string;
  user_id: string;
  user_name?: string;
  title: string;
  message: string;
  schedule_time: string;
  days?: string;
  is_active: boolean;
}


interface AdminLog {
  id: string;
  user_name: string;
  action: string;
  time: string;
  type: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [search, setSearch] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [nudgeTitle, setNudgeTitle] = useState("");
  const [nudgeMsg, setNudgeMsg] = useState("");
  const [nudgeEmoji, setNudgeEmoji] = useState("🌸");
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [nudgeSuccess, setNudgeSuccess] = useState("");

  // Reminders Manager States
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState("");
  const [editingMessage, setEditingMessage] = useState("");
  const [editingDays, setEditingDays] = useState("");
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null);



  const defaultUsers: AdminProfile[] = [
    { id: "u1", full_name: "Sona", email: "sona@careloop.app", role: "User", reminders_count: 4, joined: "2026-07-28" },
    { id: "u2", full_name: "David Miller", email: "david@bloom.io", role: "User", reminders_count: 3, joined: "2026-07-29" },
    { id: "u3", full_name: "Emily Watson", email: "emily@wellness.com", role: "User", reminders_count: 5, joined: "2026-07-30" },
    { id: "u4", full_name: "Alex Rivera", email: "alex@careloop.app", role: "Admin", reminders_count: 2, joined: "2026-07-25" },
  ];

  const defaultLogs: AdminLog[] = [
    { id: "l1", user_name: "Sona", action: "Completed 'Morning Hydration'", time: "Just now", type: "completed" },
    { id: "l2", user_name: "David Miller", action: "Snoozed 'Morning Stretch'", time: "4 mins ago", type: "snoozed" },
    { id: "l3", user_name: "Emily Watson", action: "Logged meal 'Avocado Salad Toast'", time: "12 mins ago", type: "nutrition" },
    { id: "l4", user_name: "Sona", action: "Completed 'Healthy Lunch'", time: "1 hr ago", type: "completed" },
  ];

  const defaultReminders: AdminReminder[] = [
    { id: "r1", user_id: "u1", user_name: "Sona", title: "🏃 Night Walk", message: "Time for a gentle walk at night to clear your mind. 🌙", schedule_time: "10:00 PM", is_active: true },
    { id: "r2", user_id: "u1", user_name: "Sona", title: "🛌 Time to Sleep", message: "Time to sleep! Sleep tight, Sona. 😴", schedule_time: "12:00 AM", is_active: true },
    { id: "r3", user_id: "u2", user_name: "David Miller", title: "💧 Hydration Break", message: "Drink a glass of water. Stay fresh!", schedule_time: "11:00 AM", is_active: true },
    { id: "r4", user_id: "u3", user_name: "Emily Watson", title: "🧘 Stretch & Breathe", message: "5 minutes of stretching to relax your spine.", schedule_time: "03:30 PM", is_active: true },
  ];

  // Fetch admin profiles from backend
  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/profiles`);
      if (response.data && response.data.length > 0) {
        setUsers(response.data);
      } else {
        setUsers(defaultUsers);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Loading default admin profiles.");
      setUsers(defaultUsers);
    }
  };

  // Fetch reminders across all users from backend
  const fetchReminders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/reminders`);
      if (response.data && response.data.length > 0) {
        setReminders(response.data);
      } else {
        setReminders(defaultReminders);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Loading default admin reminders.");
      setReminders(defaultReminders);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchReminders();
    setAdminLogs(defaultLogs);
  }, []);

  const handleUpdateReminderData = async (reminderId: string, newTime: string, newMessage: string, newDays: string) => {
    if (!newTime.trim()) return;

    // Optimistically update screen
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, schedule_time: newTime, message: newMessage, days: newDays } : r));
    setEditingReminderId(null);
    setEditingTime("");
    setEditingMessage("");
    setEditingDays("");

    // Update backend API
    try {
      await axios.put(`${API_BASE_URL}/api/reminders/${reminderId}`, {
        schedule_time: newTime,
        message: newMessage,
        days: newDays
      });

      // Add to admin activity log
      const matchedTitle = reminders.find(r => r.id === reminderId)?.title || "Reminder";
      const newLog: AdminLog = {
        id: Date.now().toString(),
        user_name: "Admin",
        action: `Updated reminder "${matchedTitle}" (time: ${newTime}, message: "${newMessage}", days: "${newDays}")`,
        time: "Just now",
        type: "nudge"
      };
      setAdminLogs(prev => [newLog, ...prev]);

      confetti({
        particleCount: 30,
        spread: 35,
        colors: ["#9B86FA", "#67E8A5"]
      });
    } catch (err) {
      console.warn("Could not save updated reminder to backend database.");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const matched = reminders.find(r => r.id === reminderId);
    if (!matched) return;

    // Optimistically update screen
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    setDeletingReminderId(null);

    // Update backend API
    try {
      await axios.delete(`${API_BASE_URL}/api/reminders/${reminderId}`);

      // Add to admin activity log
      const newLog: AdminLog = {
        id: Date.now().toString(),
        user_name: "Admin",
        action: `Deleted reminder "${matched.title}"`,
        time: "Just now",
        type: "completed"
      };
      setAdminLogs(prev => [newLog, ...prev]);

      confetti({
        particleCount: 25,
        spread: 30,
        colors: ["#FF7597", "#FFD075"]
      });
    } catch (err) {
      console.warn("Could not delete reminder from backend database.");
    }
  };


  // Map reminders to include username if fetched
  const mappedReminders = reminders.map(rem => {
    const matchedUser = users.find(u => u.id === rem.user_id);
    return {
      ...rem,
      user_name: matchedUser ? matchedUser.full_name : (rem.user_name || "User")
    };
  });


  const handleSendNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !nudgeTitle.trim()) return;

    // Simulate sending push nudge to user
    const selectedUserName = users.find(u => u.id === targetUser)?.full_name || "User";
    setNudgeSuccess(`Nudge "${nudgeTitle}" sent with love to ${selectedUserName}! 💌`);
    
    // Add to live admin log stream
    const newLog: AdminLog = {
      id: Date.now().toString(),
      user_name: "System Admin",
      action: `Sent custom nudge "${nudgeTitle}" ${nudgeEmoji} to ${selectedUserName}`,
      time: "Just now",
      type: "nudge"
    };
    setAdminLogs(prev => [newLog, ...prev]);

    // confetti celebration
    confetti({
      particleCount: 50,
      spread: 45,
      colors: ["#9B86FA", "#FF7597"],
    });

    // Reset inputs
    setNudgeTitle("");
    setNudgeMsg("");
    setTimeout(() => setNudgeSuccess(""), 4000);
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Custom Chart Data for week completion rate
  const weekData = [
    { day: "Mon", rate: 68 },
    { day: "Tue", rate: 75 },
    { day: "Wed", rate: 82 },
    { day: "Thu", rate: 70 },
    { day: "Fri", rate: 88 },
    { day: "Sat", rate: 94 },
    { day: "Sun", rate: 80 }
  ];

  return (
    <div className="min-h-screen py-10 px-6 max-w-6xl mx-auto flex flex-col gap-8 select-none">
      
      {/* Top navbar */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-[#A19AA8] hover:text-[#9B86FA] transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2 bg-[#9B86FA]/10 border border-[#9B86FA]/20 px-3 py-1 rounded-full text-xs text-[#9B86FA] font-bold">
          <Shield size={12} />
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-white">System Analytics & Directory</h1>
        <p className="text-sm text-[#A19AA8] font-inter mt-1">
          Monitor user compliance rates, configure custom notification alerts, and manage system registries.
        </p>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard glowColor="none" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-[#FF7597]/15 text-[#FF7597] rounded-2xl border border-[#FF7597]/10">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider">Total Users</h4>
            <p className="text-xl font-bold text-white font-outfit mt-0.5">{users.length || 142}</p>
          </div>
        </GlassCard>

        <GlassCard glowColor="none" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-[#9B86FA]/15 text-[#9B86FA] rounded-2xl border border-[#9B86FA]/10">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider">Active Reminders</h4>
            <p className="text-xl font-bold text-white font-outfit mt-0.5">384</p>
          </div>
        </GlassCard>

        <GlassCard glowColor="none" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-[#67E8A5]/15 text-[#67E8A5] rounded-2xl border border-[#67E8A5]/10">
            <BarChart2 size={20} />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider">Today's Check-offs</h4>
            <p className="text-xl font-bold text-white font-outfit mt-0.5">78.4%</p>
          </div>
        </GlassCard>

        <GlassCard glowColor="none" className="p-5 flex items-center gap-4">
          <div className="p-3 bg-[#FFD075]/15 text-[#FFD075] rounded-2xl border border-[#FFD075]/10">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider">Hydration Rate</h4>
            <p className="text-xl font-bold text-white font-outfit mt-0.5">1.4 Liters</p>
          </div>
        </GlassCard>
      </div>

      {/* Grid: Charts & Nudge Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Custom Visual Bar Chart Card */}
        <GlassCard glowColor="pink" className="lg:col-span-2 flex flex-col justify-between gap-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold font-outfit text-md text-white">Weekly Completion Trends (%)</h3>
            <span className="text-[10px] bg-white/5 text-[#A19AA8] px-2 py-0.5 rounded font-inter">Last 7 Days</span>
          </div>

          {/* Simple custom flex charts */}
          <div className="flex items-end justify-between h-44 px-2 pt-6">
            {weekData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2.5 flex-1 group">
                <div className="relative w-full flex justify-center items-end h-32">
                  {/* Tooltip on hover */}
                  <span className="absolute -top-6 text-[10px] font-bold text-white bg-[#FF7597] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.rate}%
                  </span>
                  
                  {/* Bar */}
                  <div 
                    style={{ height: `${data.rate}%` }} 
                    className="w-7 bg-gradient-to-t from-[#9B86FA] to-[#FF7597] rounded-t-lg group-hover:opacity-90 transition-all duration-300 shadow-md"
                  />
                </div>
                <span className="text-[11px] font-bold text-[#A19AA8] font-inter">{data.day}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Send Custom Nudge Card */}
        <GlassCard glowColor="purple" className="flex flex-col gap-4">
          <div>
            <h3 className="font-bold font-outfit text-md text-white">Quick Nudge Dispatcher 💌</h3>
            <p className="text-xs text-[#A19AA8] mt-0.5">Simulate client-side push alerts</p>
          </div>

          <form onSubmit={handleSendNudge} className="flex flex-col gap-3.5 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#A19AA8] uppercase">Target User</label>
              <select
                required
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F3F1F6] focus:outline-none"
              >
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#A19AA8] uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Snack Break!"
                  value={nudgeTitle}
                  onChange={(e) => setNudgeTitle(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#A19AA8] uppercase">Emoji</label>
                <select
                  value={nudgeEmoji}
                  onChange={(e) => setNudgeEmoji(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="🌸">🌸 Bloom</option>
                  <option value="💧">💧 Sip</option>
                  <option value="🏃">🏃 Move</option>
                  <option value="😴">😴 Cozy</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#A19AA8] uppercase">Short Message</label>
              <input
                type="text"
                placeholder="Time to nourish yourself..."
                value={nudgeMsg}
                onChange={(e) => setNudgeMsg(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
              />
            </div>

            {nudgeSuccess && (
              <div className="text-[11px] text-[#67E8A5] bg-[#67E8A5]/10 p-2.5 rounded-lg border border-[#67E8A5]/25">
                {nudgeSuccess}
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B86FA] to-[#FF7597] hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Send size={11} /> Send Nudge
            </button>
          </form>
        </GlassCard>

      </div>

      {/* Grid: User registry table & Live activity log stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User directory table */}
        <GlassCard glowColor="none" className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold font-outfit text-md text-white">User Compliance Registry</h3>
            
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-[#A19AA8]" size={14} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Table layout - visible on desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[#A19AA8] font-bold">
                  <th className="pb-3 pr-2">Full Name</th>
                  <th className="pb-3 pr-2">Email</th>
                  <th className="pb-3 pr-2">Role</th>
                  <th className="pb-3 pr-2">Reminders</th>
                  <th className="pb-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F3F1F6] font-medium font-inter">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-2 font-semibold font-outfit">{user.full_name}</td>
                    <td className="py-3 pr-2 text-[#A19AA8]">{user.email}</td>
                    <td className="py-3 pr-2 text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${user.role === "Admin" ? "bg-[#FF7597]/20 text-[#FF7597]" : "bg-[#9B86FA]/20 text-[#9B86FA]"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-center">{user.reminders_count}</td>
                    <td className="py-3 text-[#A19AA8]">{user.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards layout - visible on mobile */}
          <div className="block md:hidden flex flex-col gap-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-3 bg-white/3 border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white font-outfit">{user.full_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${user.role === "Admin" ? "bg-[#FF7597]/20 text-[#FF7597]" : "bg-[#9B86FA]/20 text-[#9B86FA]"}`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#A19AA8] font-inter">
                  <span className="truncate max-w-[160px]">{user.email}</span>
                  <span>Joined: {user.joined}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-1 border-t border-white/5 pt-2">
                  <span className="text-[#A19AA8]">Active Reminders:</span>
                  <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded">{user.reminders_count}</span>
                </div>
              </div>
            ))}
          </div>

        </GlassCard>

        {/* Global stream logging */}
        <GlassCard glowColor="none" className="flex flex-col gap-4">
          <h3 className="font-bold font-outfit text-md text-white">Global Activity Log</h3>
          
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {adminLogs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs p-3 bg-white/3 border border-white/5 rounded-xl items-start">
                <div className="text-base select-none mt-0.5">
                  {log.type === "completed" ? "✅" : log.type === "snoozed" ? "⏳" : log.type === "nutrition" ? "🍓" : "✉️"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate font-outfit">{log.user_name}</h4>
                  <p className="text-[11px] text-[#A19AA8] mt-0.5 leading-relaxed">{log.action}</p>
                  <span className="text-[9px] text-[#A19AA8] flex items-center gap-1 mt-1 font-inter">
                    <Clock size={9} /> {log.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      {/* Reminders Grid Row */}
      </div>

      {/* Active Reminders Registry */}
      <GlassCard glowColor="pink" className="w-full flex flex-col gap-5 mt-4">
        <div>
          <h3 className="font-bold font-outfit text-md text-white">System Active Reminders Registry</h3>
          <p className="text-xs text-[#A19AA8] mt-0.5">Manage schedule times and delete user reminders across CareLoop.</p>
        </div>

        {/* Table layout - visible on desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#A19AA8] font-bold">
                <th className="pb-3 pr-2">User Name</th>
                <th className="pb-3 pr-2">Reminder Title</th>
                <th className="pb-3 pr-2">Message Nudge</th>
                <th className="pb-3 pr-2">Scheduled Time</th>
                <th className="pb-3 pr-2">Active Days</th>
                <th className="pb-3 pr-2">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#F3F1F6] font-medium font-inter">
              {mappedReminders.map((rem) => {
                const isEditing = editingReminderId === rem.id;

                return (
                  <tr key={rem.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-2 font-semibold font-outfit text-[#9B86FA]">{rem.user_name}</td>
                    <td className="py-3 pr-2 text-white font-semibold font-outfit">{rem.title}</td>
                    <td className="py-3 pr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingMessage}
                          onChange={(e) => setEditingMessage(e.target.value)}
                          className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white w-full max-w-[200px] focus:outline-none focus:border-[#9B86FA]"
                        />
                      ) : (
                        <span className="text-[#A19AA8] max-w-xs truncate block" title={rem.message}>
                          {rem.message}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-[#9B86FA]"
                        />
                      ) : (
                        <span className="font-semibold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                          {rem.schedule_time}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingDays}
                          onChange={(e) => setEditingDays(e.target.value)}
                          className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white w-28 focus:outline-none focus:border-[#9B86FA]"
                          placeholder="e.g. Mon, Tue, Thu"
                        />
                      ) : (
                        <span className="font-semibold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                          {rem.days || "Daily"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${rem.is_active ? "bg-[#67E8A5]/20 text-[#67E8A5]" : "bg-white/10 text-[#A19AA8]"}`}>
                        {rem.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdateReminderData(rem.id, editingTime, editingMessage, editingDays)}
                              className="p-1.5 rounded-lg bg-[#67E8A5]/15 text-[#67E8A5] border border-[#67E8A5]/25 hover:bg-[#67E8A5]/25 transition-colors cursor-pointer"
                              title="Save Changes"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingReminderId(null);
                                setEditingTime("");
                                setEditingMessage("");
                                setEditingDays("");
                              }}
                              className="p-1.5 rounded-lg bg-white/5 text-[#A19AA8] border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            {deletingReminderId === rem.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteReminder(rem.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#FF7597]/20 text-[#FF7597] border border-[#FF7597]/30 hover:bg-[#FF7597]/35 transition-colors text-[10px] font-bold cursor-pointer"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  onClick={() => setDeletingReminderId(null)}
                                  className="p-1 rounded-lg bg-white/5 text-[#A19AA8] border border-white/5 hover:bg-white/10 text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingReminderId(rem.id);
                                    setEditingTime(rem.schedule_time);
                                    setEditingMessage(rem.message);
                                    setEditingDays(rem.days || "Daily");
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#9B86FA] hover:bg-[#9B86FA]/10 transition-all cursor-pointer"
                                  title="Edit Reminder"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => setDeletingReminderId(rem.id)}
                                  className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#FF7597] hover:bg-[#FF7597]/10 transition-all cursor-pointer"
                                  title="Delete Reminder"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards layout - visible on mobile */}
        <div className="block md:hidden flex flex-col gap-4">
          {mappedReminders.map((rem) => {
            const isEditing = editingReminderId === rem.id;

            return (
              <div key={rem.id} className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold font-outfit text-sm text-[#9B86FA]">{rem.user_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${rem.is_active ? "bg-[#67E8A5]/20 text-[#67E8A5]" : "bg-white/10 text-[#A19AA8]"}`}>
                    {rem.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-white">{rem.title}</span>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <label className="text-[10px] text-[#A19AA8] font-bold uppercase">Reminder Message</label>
                      <textarea
                        value={editingMessage}
                        onChange={(e) => setEditingMessage(e.target.value)}
                        rows={2}
                        className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white w-full focus:outline-none focus:border-[#9B86FA] resize-none"
                      />
                      <label className="text-[10px] text-[#A19AA8] font-bold uppercase mt-1">Scheduled Time</label>
                      <input
                        type="text"
                        value={editingTime}
                        onChange={(e) => setEditingTime(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white w-full max-w-[120px] focus:outline-none focus:border-[#9B86FA]"
                      />
                      <label className="text-[10px] text-[#A19AA8] font-bold uppercase mt-1">Active Days</label>
                      <input
                        type="text"
                        value={editingDays}
                        onChange={(e) => setEditingDays(e.target.value)}
                        className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white w-full max-w-[200px] focus:outline-none focus:border-[#9B86FA]"
                        placeholder="e.g. Mon, Tue, Thu"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-[#A19AA8] leading-relaxed mt-0.5">{rem.message}</p>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {!isEditing && (
                      <>
                        <span className="text-[11px] font-semibold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                          ⏰ {rem.schedule_time}
                        </span>
                        <span className="text-[11px] font-semibold text-[#FF7597] bg-[#FF7597]/15 border border-[#FF7597]/20 px-2 py-1 rounded-lg">
                          📅 {rem.days || "Daily"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdateReminderData(rem.id, editingTime, editingMessage, editingDays)}
                          className="px-3 py-1.5 rounded-lg bg-[#67E8A5]/15 text-[#67E8A5] border border-[#67E8A5]/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} /> Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingReminderId(null);
                            setEditingTime("");
                            setEditingMessage("");
                            setEditingDays("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-[#A19AA8] border border-white/5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {deletingReminderId === rem.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#FF7597]/20 text-[#FF7597] border border-[#FF7597]/30 hover:bg-[#FF7597]/35 transition-colors text-[10px] font-bold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeletingReminderId(null)}
                              className="p-1 rounded-lg bg-white/5 text-[#A19AA8] border border-white/5 hover:bg-white/10 text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingReminderId(rem.id);
                                setEditingTime(rem.schedule_time);
                                setEditingMessage(rem.message);
                                setEditingDays(rem.days || "Daily");
                              }}
                              className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#9B86FA] hover:bg-[#9B86FA]/10 transition-all cursor-pointer"
                              title="Edit Reminder"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingReminderId(rem.id)}
                              className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#FF7597] hover:bg-[#FF7597]/10 transition-all cursor-pointer"
                              title="Delete Reminder"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

    </div>
  );
}
