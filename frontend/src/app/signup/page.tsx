"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signUpUser, signInWithOAuth } = useAuth();
  
  const [name, setName] = useState("");
  const [isPhone, setIsPhone] = useState(false); // Toggle between Email and Phone
  const [identifier, setIdentifier] = useState(""); // Holds email or phone number
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Please enter your email or phone number.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await signUpUser(name, identifier.trim(), isPhone, password);
      
      if (res.success) {
        setSuccessMsg(res.message + " Redirecting... ❤️");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Something went wrong during sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg(`Signing up with ${provider === "google" ? "Google... 🌸" : "Apple... 🌙"}`);

    try {
      const res = await signInWithOAuth(provider);
      if (res.success) {
        setSuccessMsg(res.message + " Redirecting... ❤️");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(res.message);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(`Authentication error during ${provider} registration.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 select-none">
      
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-[#A19AA8] hover:text-[#FF7597] transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to landing page
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] flex items-center justify-center text-white text-xl font-bold shadow-md cute-shadow-pink select-none">
            ❤️
          </div>
        </div>
        <h2 className="text-center font-outfit text-3xl font-extrabold text-white">
          Join CareLoop
        </h2>
        <p className="mt-2 text-center text-sm text-[#A19AA8] font-inter">
          Start receiving gentle reminders and lovely tracking insights.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard glowColor="purple" hoverEffect={false} className="px-8 py-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSignup}>
            
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sona"
                className="mt-1 block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors"
              />
            </div>

            {/* Toggle: Email vs Phone */}
            <div className="flex bg-white/5 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsPhone(false);
                  setIdentifier("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  !isPhone ? "bg-[#FF7597] text-white" : "text-[#A19AA8] hover:text-white"
                }`}
              >
                Use Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPhone(true);
                  setIdentifier("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  isPhone ? "bg-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
                }`}
              >
                Use Phone Number
              </button>
            </div>

            {/* Email / Phone Field */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                {isPhone ? "Phone Number" : "Email Address"}
              </label>
              <input
                id="identifier"
                type={isPhone ? "tel" : "email"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isPhone ? "+91 98765 43210" : "name@example.com"}
                className="mt-1 block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#A19AA8] uppercase tracking-wider font-inter">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1 block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#9B86FA] transition-colors"
              />
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="text-xs text-[#FF7597] bg-[#FF7597]/10 p-3 rounded-lg border border-[#FF7597]/20">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="text-xs text-[#67E8A5] bg-[#67E8A5]/10 p-3 rounded-lg border border-[#67E8A5]/20">
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md cute-shadow-pink disabled:opacity-50"
            >
              <Sparkles size={12} />
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-semibold font-inter">
                <span className="bg-[#14121F] px-2 text-[#A19AA8]">Or register with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin("google")}
                className="py-2.5 border border-white/10 rounded-xl text-xs text-white bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium disabled:opacity-50"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin("apple")}
                className="py-2.5 border border-white/10 rounded-xl text-xs text-white bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium disabled:opacity-50"
              >
                <span>Apple</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-[#A19AA8] font-inter">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF7597] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </div>

    </div>
  );
}
