"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Lock, Heart, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/context/auth-context";
import { AppLogo } from "@/components/ui/app-logo";

export default function LoginPage() {
  const router = useRouter();
  const { signInUser } = useAuth();
  
  const [role, setRole] = useState<"user" | "admin">("user");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const email = role === "admin" ? "vrushabh@careloop.app" : "sona@careloop.app";
    const expectedPass = role === "admin" ? "vrushabhlove" : "sonalove";

    if (password !== expectedPass) {
      setErrorMsg("Incorrect passcode. Please try again, love.");
      setLoading(false);
      return;
    }

    try {
      const res = await signInUser(email, false, password);
      
      if (res.success) {
        setSuccessMsg(role === "admin" ? "Welcome back, Vrushabh! 👑 Entry granted." : "Welcome back, Sona! 🌸 Opening your space.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 select-none relative overflow-hidden">
      
      {/* Background soft light circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF7597]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9B86FA]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <AppLogo size="lg" className="animate-bounce" />
        </motion.div>
        
        <h2 className="font-outfit text-4xl font-extrabold tracking-tight text-white">
          CareLoop
        </h2>
        <p className="mt-2 text-sm text-[#A19AA8] font-inter">
          A private wellness & connection space built with love.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard glowColor={role === "admin" ? "purple" : "pink"} hoverEffect={false} className="px-8 py-8 shadow-2xl border border-white/10 bg-[#12101a]/85 backdrop-blur-xl rounded-[32px]">
            
            {/* Custom Tab Selector */}
            <div className="flex bg-white/5 p-1 rounded-2xl gap-1 mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setRole("user");
                  setPassword("");
                  setErrorMsg("");
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "user" 
                    ? "bg-gradient-to-r from-[#FF7597] to-[#FF8EAB] text-white shadow-md shadow-[#FF7597]/25" 
                    : "text-[#A19AA8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Heart size={13} className={role === "user" ? "fill-current animate-pulse" : ""} />
                Sona (User)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("admin");
                  setPassword("");
                  setErrorMsg("");
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "admin" 
                    ? "bg-gradient-to-r from-[#9B86FA] to-[#B09FFA] text-white shadow-md shadow-[#9B86FA]/25" 
                    : "text-[#A19AA8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield size={13} />
                Vrushabh (Admin)
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Passcode input field */}
              <div className="relative">
                <label htmlFor="passcode" className="block text-[10px] font-bold text-[#A19AA8] uppercase tracking-wider font-inter mb-2">
                  Enter Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30">
                    <Lock size={15} />
                  </span>
                  <input
                    id="passcode"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597] focus:ring-1 focus:ring-[#FF7597] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Alert Messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#FF7597] bg-[#FF7597]/10 p-3.5 rounded-2xl border border-[#FF7597]/15 flex items-center gap-2"
                >
                  <span>⚠️</span> {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#67E8A5] bg-[#67E8A5]/10 p-3.5 rounded-2xl border border-[#67E8A5]/15 flex items-center gap-2"
                >
                  <span>❤️</span> {successMsg}
                </motion.div>
              )}

              {/* Unlock Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 rounded-2xl text-xs font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                  role === "admin"
                    ? "bg-gradient-to-r from-[#9B86FA] to-[#FF7597] hover:opacity-95 cute-shadow-pink"
                    : "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 cute-shadow-pink"
                }`}
              >
                <Sparkles size={13} />
                {loading ? "Unlocking space..." : "Unlock CareLoop"}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      </div>

    </div>
  );
}
