"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Search, Heart, Sparkles, Play, Plus, Trash2, 
  ExternalLink, CheckCircle, Flame, Dumbbell, Apple, Clock, AlertCircle, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import confetti from "canvas-confetti";

interface Reel {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "yoga" | "diet" | "habits";
  shortcode: string;
  isCustom?: boolean;
}

export default function ReelsPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Default seed reels (PCOD Yoga & Diet themes)
  const defaultReels: Reel[] = [
    {
      id: "seed-1",
      title: "Baddha Konasana (Butterfly Pose)",
      description: "Opens hip joints, improves blood circulation to the pelvic organs, and relieves stress.",
      url: "https://www.instagram.com/reel/C3bO4v9SB7x/",
      category: "yoga",
      shortcode: "C3bO4v9SB7x"
    },
    {
      id: "seed-2",
      title: "Malasana (Garland Pose)",
      description: "Strengthens the pelvic floor, increases hip mobility, and helps regulate menstrual flow.",
      url: "https://www.instagram.com/reel/Czo5v9S5X_w/",
      category: "yoga",
      shortcode: "Czo5v9S5X_w"
    },
    {
      id: "seed-3",
      title: "Seed Cycling for PCOD Balance",
      description: "A natural way to balance estrogen and progesterone using flax, pumpkin, sesame, and sunflower seeds.",
      url: "https://www.instagram.com/reel/C10R9yBSj0V/",
      category: "diet",
      shortcode: "C10R9yBSj0V"
    },
    {
      id: "seed-4",
      title: "PCOD Hormone Balancing Smoothie",
      description: "A low-glycemic, antioxidant-rich breakfast smoothie featuring spinach, berries, and plant protein.",
      url: "https://www.instagram.com/reel/C5qE8x0LyP_/",
      category: "diet",
      shortcode: "C5qE8x0LyP_"
    },
    {
      id: "seed-5",
      title: "Spearmint Tea Routine",
      description: "Consuming spearmint tea twice daily helps reduce androgen (male hormone) levels and control hirsutism.",
      url: "https://www.instagram.com/reel/C-aBcdEfgHi/",
      category: "habits",
      shortcode: "C-aBcdEfgHi"
    }
  ];

  // States
  const [reels, setReels] = useState<Reel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState<Record<string, number>>({});
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "yoga" | "diet" | "habits">("all");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"yoga" | "diet" | "habits">("yoga");
  const [formError, setFormError] = useState("");

  // Load state from localStorage on mount
  useEffect(() => {
    // 1. Load Reels (seeds + custom)
    const storedCustom = localStorage.getItem("careloop_custom_reels");
    if (storedCustom) {
      try {
        const customList = JSON.parse(storedCustom) as Reel[];
        // Filter customList to make sure no duplicates
        const merged = [...defaultReels, ...customList.map(r => ({ ...r, isCustom: true }))];
        setReels(merged);
      } catch (e) {
        setReels(defaultReels);
      }
    } else {
      setReels(defaultReels);
    }

    // 2. Load Favorites
    const storedFavs = localStorage.getItem("careloop_favorite_reels");
    if (storedFavs) {
      try {
        setFavorites(JSON.parse(storedFavs));
      } catch (e) {}
    }

    // 3. Load Completion Counts
    const storedComps = localStorage.getItem("careloop_completed_reels");
    if (storedComps) {
      try {
        setCompletedCount(JSON.parse(storedComps));
      } catch (e) {}
    }
  }, []);

  // Utility to parse URL
  const extractShortcode = (urlStr: string): string | null => {
    if (!urlStr) return null;
    const cleanUrl = urlStr.trim();
    // Regular expressions for matching Instagram Reel / Post URLs
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i;
    const match = cleanUrl.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    // If it's already a shortcode
    if (/^[a-zA-Z0-9_-]{5,20}$/.test(cleanUrl)) {
      return cleanUrl;
    }
    return null;
  };

  // Toggle Favorite
  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
      // small pop confetti
      confetti({
        particleCount: 15,
        spread: 30,
        colors: ["#FF7597"]
      });
    }
    setFavorites(updated);
    localStorage.setItem("careloop_favorite_reels", JSON.stringify(updated));
  };

  // Toggle Practice Complete
  const markAsPracticed = (id: string) => {
    const updatedCount = {
      ...completedCount,
      [id]: (completedCount[id] || 0) + 1
    };
    setCompletedCount(updatedCount);
    localStorage.setItem("careloop_completed_reels", JSON.stringify(updatedCount));

    // Celebratory Confetti
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#67E8A5", "#FF7597", "#9B86FA"]
    });
  };

  // Add Reel
  const handleAddReel = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim()) {
      setFormError("Please enter a title.");
      return;
    }

    const shortcode = extractShortcode(newUrl);
    if (!shortcode) {
      setFormError("Invalid Instagram link. Make sure it contains /reel/ or /p/ followed by the post ID.");
      return;
    }

    const newReelItem: Reel = {
      id: "custom-" + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || "User added practice guide.",
      url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://www.instagram.com/reel/${shortcode}/`,
      category: newCategory,
      shortcode,
      isCustom: true
    };

    // Save custom reels
    const storedCustom = localStorage.getItem("careloop_custom_reels");
    let customList: Reel[] = [];
    if (storedCustom) {
      try {
        customList = JSON.parse(storedCustom);
      } catch (e) {}
    }
    customList.push(newReelItem);
    localStorage.setItem("careloop_custom_reels", JSON.stringify(customList));

    // Update screen state
    setReels([...reels, newReelItem]);

    // Reset Form & Close
    setNewTitle("");
    setNewUrl("");
    setNewDesc("");
    setNewCategory("yoga");
    setShowAddModal(false);

    // Nice success confetti
    confetti({
      particleCount: 50,
      spread: 45,
      colors: ["#9B86FA", "#67E8A5"]
    });
  };

  // Delete Custom Reel
  const handleDeleteReel = (id: string) => {
    // 1. Remove from screen state
    setReels(reels.filter(r => r.id !== id));

    // 2. Remove from custom localStorage list
    const storedCustom = localStorage.getItem("careloop_custom_reels");
    if (storedCustom) {
      try {
        const customList = JSON.parse(storedCustom) as Reel[];
        const filtered = customList.filter(r => r.id !== id && r.id !== ("custom-" + id));
        localStorage.setItem("careloop_custom_reels", JSON.stringify(filtered));
      } catch (e) {}
    }
  };

  // Filter & Search Logic
  const filteredReels = reels.filter(reel => {
    const matchesSearch = reel.title.toLowerCase().includes(search.toLowerCase()) || 
                          reel.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || reel.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalPracticedTimes = Object.values(completedCount).reduce((a, b) => a + b, 0);
  const totalUniquePracticed = Object.keys(completedCount).length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col gap-8 select-none">
      
      {/* Top Navbar */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-[#A19AA8] hover:text-[#9B86FA] transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/nutrition" className="text-xs text-[#A19AA8] hover:text-[#FF7597] transition-colors font-semibold">
            Nutrition 🍓
          </Link>
          <button 
            onClick={signOut}
            className="text-xs text-[#A19AA8] hover:text-[#FF7597] flex items-center gap-1 transition-colors font-semibold cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
            Wellness Hub & PCOD Practices 🧘‍♀️
          </h1>
          <p className="text-sm text-[#A19AA8] font-inter mt-1.5">
            A beautiful, custom space built with love. Watch, learn, and practice targeted PCOD yoga and recipes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-6 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#9B86FA] to-[#FF7597] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center gap-1.5 shadow-md cute-shadow-purple cursor-pointer w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Add Custom Reel
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard glowColor="none" className="p-4 flex items-center gap-4 border-white/5">
          <div className="w-10 h-10 rounded-xl bg-[#9B86FA]/15 text-[#9B86FA] border border-[#9B86FA]/15 flex items-center justify-center text-lg">
            🧘‍♀️
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider block">Total Practices</span>
            <span className="text-lg font-bold text-white font-outfit">{totalPracticedTimes} sessions logged</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="none" className="p-4 flex items-center gap-4 border-white/5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7597]/15 text-[#FF7597] border border-[#FF7597]/15 flex items-center justify-center text-lg">
            ❤️
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider block">Bookmarks</span>
            <span className="text-lg font-bold text-white font-outfit">{favorites.length} saved guides</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="none" className="p-4 flex items-center gap-4 border-white/5">
          <div className="w-10 h-10 rounded-xl bg-[#67E8A5]/15 text-[#67E8A5] border border-[#67E8A5]/15 flex items-center justify-center text-lg">
            🔥
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A19AA8] tracking-wider block">Unique Workouts</span>
            <span className="text-lg font-bold text-white font-outfit">{totalUniquePracticed} items completed</span>
          </div>
        </GlassCard>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/3 p-4 rounded-3xl border border-white/5">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-[#A19AA8]" size={16} />
          <input
            type="text"
            placeholder="Search yoga poses or diet tips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#9B86FA] placeholder-white/20 transition-all"
          />
        </div>

        {/* Filter categories */}
        <div className="flex bg-[#14121F] border border-white/5 rounded-2xl p-1 gap-1 w-full md:w-auto">
          {(["all", "yoga", "diet", "habits"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize ${
                activeCategory === cat 
                  ? "bg-gradient-to-r from-[#9B86FA] to-[#FF7597] text-white" 
                  : "text-[#A19AA8] hover:text-white"
              }`}
            >
              {cat === "all" ? "🌐 All" : cat === "yoga" ? "🧘 Yoga" : cat === "diet" ? "🥗 Diet" : "✨ Habits"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Reels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredReels.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#A19AA8] text-sm gap-2">
              <span className="text-3xl">🧘‍♀️</span>
              <span>No practices found matching your search. Add a new one!</span>
            </div>
          ) : (
            filteredReels.map((reel) => {
              const isFav = favorites.includes(reel.id);
              const plays = completedCount[reel.id] || 0;

              return (
                <motion.div
                  key={reel.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <GlassCard glowColor={reel.category === "yoga" ? "purple" : reel.category === "diet" ? "pink" : "green"} hoverEffect={false} className="flex flex-col gap-4">
                    
                    {/* Header line on card */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                            reel.category === "yoga"
                              ? "bg-[#9B86FA]/10 border-[#9B86FA]/20 text-[#9B86FA]"
                              : reel.category === "diet"
                              ? "bg-[#FF7597]/10 border-[#FF7597]/20 text-[#FF7597]"
                              : "bg-[#67E8A5]/10 border-[#67E8A5]/20 text-[#67E8A5]"
                          }`}>
                            {reel.category}
                          </span>
                          
                          {reel.isCustom && (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A19AA8]">
                              Custom
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white font-outfit text-base sm:text-lg mt-2 leading-snug">
                          {reel.title}
                        </h3>
                      </div>

                      {/* Top Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFavorite(reel.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isFav 
                              ? "bg-[#FF7597]/15 border-[#FF7597]/30 text-[#FF7597]" 
                              : "bg-white/5 border-white/5 text-[#A19AA8] hover:text-white"
                          }`}
                          title="Bookmark Practice"
                        >
                          <Heart size={15} className={isFav ? "fill-current" : ""} />
                        </button>

                        {reel.isCustom && (
                          <button
                            onClick={() => handleDeleteReel(reel.id)}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#A19AA8] hover:text-[#FF7597] transition-all cursor-pointer"
                            title="Delete custom guide"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#A19AA8] font-inter leading-relaxed">
                      {reel.description}
                    </p>

                    {/* Responsive Instagram Iframe Embed */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/40 aspect-[9/16] max-h-[460px] w-full flex items-center justify-center">
                      
                      {/* Custom preview styling behind the iframe load */}
                      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center text-xs text-[#A19AA8]">
                        <RefreshCw className="animate-spin text-[#9B86FA] mb-2" size={18} />
                        <span>Loading practice feed...</span>
                      </div>

                      {/* Live Embed */}
                      <iframe
                        src={`https://www.instagram.com/reel/${reel.shortcode}/embed`}
                        className="relative z-10 w-full h-full border-0"
                        scrolling="no"
                        allowFullScreen
                        allow="encrypted-media"
                      />
                    </div>

                    {/* Footer / Completion tracking */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-white/5 pt-3.5 mt-1">
                      
                      <span className="text-[11px] text-[#A19AA8] font-medium font-inter flex items-center gap-1.5">
                        <Clock size={12} className="text-[#FF7597]" />
                        Completed <span className="text-white font-bold">{plays} times</span> this week
                      </span>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <a
                          href={reel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-bold text-[#A19AA8] bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          Instagram
                        </a>

                        <button
                          onClick={() => markAsPracticed(reel.id)}
                          className="flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#67E8A5] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={12} />
                          Practiced!
                        </button>
                      </div>

                    </div>

                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Reel Add Modal Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard glowColor="purple" hoverEffect={false} className="relative p-6 flex flex-col gap-4 border border-white/10">
                
                <div>
                  <h3 className="text-lg font-bold text-white font-outfit flex items-center gap-1.5">
                    <Sparkles size={16} className="text-[#9B86FA] animate-pulse" /> Add Practice Video
                  </h3>
                  <p className="text-xs text-[#A19AA8] mt-1 font-inter">
                    Paste any public Instagram post or Reel link to display the guide on this page.
                  </p>
                </div>

                <form onSubmit={handleAddReel} className="flex flex-col gap-4">
                  
                  {/* Link Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#A19AA8] font-bold">Instagram Reel URL</label>
                    <input
                      type="text"
                      required
                      placeholder="https://www.instagram.com/reel/C3bO4v9.../"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors"
                    />
                  </div>

                  {/* Title Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#A19AA8] font-bold">Title / Pose Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Setu Bandhasana (Bridge Pose)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#A19AA8] font-bold">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="bg-[#14121F] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F3F1F6] focus:outline-none focus:border-[#9B86FA] transition-colors"
                    >
                      <option value="yoga">🧘 Yoga & Movement</option>
                      <option value="diet">🥗 Diet & Nutrition</option>
                      <option value="habits">✨ Hormonal Routine</option>
                    </select>
                  </div>

                  {/* Description Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#A19AA8] font-bold">Brief Benefits / Guide Note</label>
                    <textarea
                      placeholder="e.g. Stimulates core thyroid gland, reduces stress, and opens tight back hips."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors resize-none"
                    />
                  </div>

                  {/* Error Notification */}
                  {formError && (
                    <div className="text-[11px] text-[#FF7597] bg-[#FF7597]/15 p-3 rounded-xl border border-[#FF7597]/20 flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormError("");
                        setShowAddModal(false);
                      }}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#A19AA8] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B86FA] to-[#FF7597] hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      Save Guide
                    </button>
                  </div>

                </form>

              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
