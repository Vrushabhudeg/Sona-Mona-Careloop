"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signInUser, signInWithOAuth, isMockUser } = useAuth();
  
  const [isPhone, setIsPhone] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showMockOAuthModal, setShowMockOAuthModal] = useState<"google" | "apple" | null>(null);
  const [mockLoadingUser, setMockLoadingUser] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Please enter your email or phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await signInUser(identifier.trim(), isPhone, password);
      
      if (res.success) {
        setSuccessMsg(res.message + " Redirecting... ❤️");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Invalid credentials or authentication error.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    if (isMockUser) {
      setShowMockOAuthModal(provider);
    } else {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg(`Redirecting to ${provider === "google" ? "Google" : "Apple"} Authentication... 🌸`);

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
        setErrorMsg(`Authentication error during ${provider} sign-in.`);
        setLoading(false);
      }
    }
  };

  const handleSelectMockAccount = async (email: string) => {
    const provider = showMockOAuthModal;
    if (!provider) return;

    setMockLoadingUser(email);
    setErrorMsg("");
    setSuccessMsg(`Authenticating with ${provider === "google" ? "Google" : "Apple"} as ${email === "vrushabh@careloop.app" ? "Vrushabh" : "Sona"}... 🌸`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await signInWithOAuth(provider, email);
      if (res.success) {
        setSuccessMsg(res.message + " Redirecting... ❤️");
        setShowMockOAuthModal(null);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Simulation authentication error.");
    } finally {
      setMockLoadingUser(null);
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
          Welcome back to CareLoop
        </h2>
        <p className="mt-2 text-center text-sm text-[#A19AA8] font-inter">
          Let's continue building your healthy flow.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard glowColor="pink" hoverEffect={false} className="px-8 py-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            
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
                className="mt-1 block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597] transition-colors"
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
                placeholder="••••••••"
                className="mt-1 block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF7597] transition-colors"
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
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-semibold font-inter">
                <span className="bg-[#14121F] px-2 text-[#A19AA8]">Or continue with</span>
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
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#FF7597] font-semibold hover:underline">
              Create one here
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Mock OAuth Modal Chooser */}
      <AnimatePresence mode="wait">
        {showMockOAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass rounded-3xl border border-white/10 p-6 z-10 shadow-2xl relative bg-[#14121F]"
            >
              {showMockOAuthModal === "google" ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs text-black">
                        G
                      </div>
                      <h3 className="text-md font-bold font-outfit text-white">
                        Sign in with Google
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowMockOAuthModal(null)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#A19AA8] font-inter mb-4">
                    Choose a Google account to continue to CareLoop:
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMockAccount("sona@careloop.app")}
                      disabled={mockLoadingUser !== null}
                      className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] flex items-center justify-center text-white text-xs font-bold">
                        S
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-xs font-outfit">Sona</h4>
                        <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">sona@careloop.app</p>
                      </div>
                      {mockLoadingUser === "sona@careloop.app" && (
                        <div className="w-3.5 h-3.5 border-2 border-[#FF7597] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectMockAccount("vrushabh@careloop.app")}
                      disabled={mockLoadingUser !== null}
                      className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9B86FA] to-[#67E8A5] flex items-center justify-center text-white text-xs font-bold">
                        V
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-xs font-outfit">Vrushabh</h4>
                        <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">vrushabh@careloop.app (Caregiver)</p>
                      </div>
                      {mockLoadingUser === "vrushabh@careloop.app" && (
                        <div className="w-3.5 h-3.5 border-2 border-[#9B86FA] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-black font-bold select-none">
                        
                      </div>
                      <h3 className="text-md font-bold font-outfit text-white">
                        Sign in with Apple ID
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowMockOAuthModal(null)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#A19AA8] font-inter mb-4">
                    Do you want to sign in to CareLoop using your Apple ID?
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMockAccount("sona@careloop.app")}
                      disabled={mockLoadingUser !== null}
                      className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center text-white text-xs font-bold">
                        
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-xs font-outfit">Use Apple ID: Sona</h4>
                        <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">sona@careloop.app</p>
                      </div>
                      {mockLoadingUser === "sona@careloop.app" && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectMockAccount("vrushabh@careloop.app")}
                      disabled={mockLoadingUser !== null}
                      className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center text-white text-xs font-bold">
                        
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-xs font-outfit">Use Apple ID: Vrushabh</h4>
                        <p className="text-[10px] text-[#A19AA8] font-inter mt-0.5">vrushabh@careloop.app (Caregiver)</p>
                      </div>
                      {mockLoadingUser === "vrushabh@careloop.app" && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
