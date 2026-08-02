"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Sparkles, ArrowRight, Smile, Activity, Apple, Dumbbell } from "lucide-react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { CuteReminder } from "@/components/ui/cute-reminder";
import { GlassCard } from "@/components/ui/glass-card";
import { CuteSonaMonaNote } from "@/components/ui/cute-sona-mona-note";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Premium Glassy Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0B0A0F]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] flex items-center justify-center text-white shadow-md cute-shadow-pink font-bold">
              ❤️
            </div>
            <span className="font-outfit font-extrabold text-xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              CareLoop
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/reels" className="text-sm font-medium text-[#A19AA8] hover:text-[#9B86FA] transition-colors flex items-center gap-1.5">
              <Dumbbell size={14} /> Yoga & Reels
            </Link>
            <Link href="/nutrition" className="text-sm font-medium text-[#A19AA8] hover:text-[#FF7597] transition-colors flex items-center gap-1.5">
              <Apple size={14} /> Nutrition
            </Link>
            <Link href="/login" className="text-sm font-medium text-[#A19AA8] hover:text-[#9B86FA] transition-colors">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 shadow-md cute-shadow-pink"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Side: Copywriting and Live Reminder Demo */}
        <div className="flex-1 text-center lg:text-left flex flex-col justify-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-[#FF7597]/10 border border-[#FF7597]/25 px-3 py-1.5 rounded-full text-[#FF7597] text-xs font-bold w-fit mx-auto lg:mx-0 mb-6"
          >
            <Sparkles size={12} className="animate-spin" />
            <span>Introducing Bloom & CareLoop</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold font-outfit tracking-tight leading-[1.1] mb-6 text-white"
          >
            Because Someone <br />
            <span className="bg-gradient-to-r from-[#FF7597] via-[#9B86FA] to-[#67E8A5] bg-clip-text text-transparent">
              Cares About You
            </span> ❤️
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-[#A19AA8] font-inter max-w-lg leading-relaxed mb-8 mx-auto lg:mx-0"
          >
            Build healthy habits, balance your nutrition, and receive cute, friendly nudges to stay on track. Perfectly crafted for you and the people who want to see you smile.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12"
          >
            <Link 
              href="/signup" 
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 shadow-lg cute-shadow-pink"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/nutrition" 
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-sm text-[#F3F1F6] bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 border border-white/5"
            >
              Explore Diet & Nutrition
            </Link>
          </motion.div>

          {/* Live Reminder Demo Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-md w-full mx-auto lg:mx-0"
          >
            <div className="mb-2 px-1 flex justify-between items-center text-xs text-[#A19AA8] font-semibold tracking-wide uppercase">
              <span>Live Reminder Sandbox</span>
              <span className="text-[#FF7597] animate-pulse">Try clicking completed!</span>
            </div>
            <CuteReminder
              title="Time for a Walk"
              message="Dinner's over 😊. A quick 20-minute walk will help you feel refreshed and sleep better tonight."
              emoji="🚶"
              time="10:14 PM"
            />
          </motion.div>

        </div>

        {/* Right Side: High-fidelity interactive Phone View */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1 flex justify-center lg:justify-end"
        >
          <PhoneMockup />
        </motion.div>

      </main>

      {/* Feature Blocks Section */}
      <section className="border-t border-white/5 bg-[#0B0A0F]/30 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold font-outfit text-white mb-4">
              Everything to Keep You Smiling
            </h2>
            <p className="text-[#A19AA8] font-inter text-sm">
              Features built with love, premium design aesthetics, and a focus on simple, delightful wellness actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard glowColor="pink" hoverEffect className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF7597]/15 text-[#FF7597] border border-[#FF7597]/20 flex items-center justify-center text-xl">
                🌸
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Delightful Reminders</h3>
              <p className="text-sm text-[#A19AA8] font-inter leading-relaxed">
                Receive notifications that feel like warm notes from a friend. Track and mark them finished in real time.
              </p>
            </GlassCard>

            <GlassCard glowColor="purple" hoverEffect className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#9B86FA]/15 text-[#9B86FA] border border-[#9B86FA]/20 flex items-center justify-center text-xl">
                🍓
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Nutrition & Diet Tracker</h3>
              <p className="text-sm text-[#A19AA8] font-inter leading-relaxed">
                Log breakfast, lunch, dinner, snacks, and water intake using a sleek interface. Visualize macros progress in style.
              </p>
            </GlassCard>

            <GlassCard glowColor="green" hoverEffect className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#67E8A5]/15 text-[#67E8A5] border border-[#67E8A5]/20 flex items-center justify-center text-xl">
                ✨
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Streaks & Celebration</h3>
              <p className="text-sm text-[#A19AA8] font-inter leading-relaxed">
                Build high-vibe streaks and unlock adorable confetti feedback when finishing wellness actions.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Cute Personal Note for Sona-Mona */}
      <CuteSonaMonaNote />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#0B0A0F]/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#A19AA8]">
          <div className="flex items-center gap-1.5 font-outfit font-bold text-white">
            <span className="text-[#FF7597]">❤️</span> CareLoop Wellness App
          </div>
          <div>
            Built to make you smile. Every single day.
          </div>
        </div>
      </footer>

    </div>
  );
}
