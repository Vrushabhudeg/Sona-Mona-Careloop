"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isMockUser: boolean;
  signUpUser: (name: string, identifier: string, isPhone: boolean, pass: string) => Promise<{ success: boolean; message: string }>;
  signInUser: (identifier: string, isPhone: boolean, pass: string) => Promise<{ success: boolean; message: string }>;
  signInWithOAuth: (provider: "google" | "apple", email?: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isMockUser: false,
  signUpUser: async () => ({ success: false, message: "" }),
  signInUser: async () => ({ success: false, message: "" }),
  signInWithOAuth: async (provider: "google" | "apple", email?: string) => ({ success: false, message: "" }),
  signOut: async () => { },
});

// Helper to hash password using SHA-256 client-side
async function hashPassword(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return password; // Fallback for servers
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to generate a valid UUID v4
function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);

  useEffect(() => {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setIsMockUser(isMock);

    if (isMock) {
      // Check if there is an active session stored in localStorage
      const activeSession = localStorage.getItem("careloop_active_user");
      if (activeSession) {
        setUser(JSON.parse(activeSession));
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error fetching initial session from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real world signup
  const signUpUser = async (name: string, identifier: string, isPhone: boolean, pass: string) => {
    if (!isMockUser) {
      try {
        const signupParams = isPhone
          ? { phone: identifier, password: pass, options: { data: { full_name: name } } }
          : { email: identifier, password: pass, options: { data: { full_name: name } } };

        const { data, error } = await supabase.auth.signUp(signupParams);
        if (error) throw error;

        return { success: true, message: "Account created! Confirm your verification nudge." };
      } catch (err: any) {
        return { success: false, message: err.message || "Signup failed." };
      }
    } else {
      // Mock Encrypted localStorage signup
      try {
        const usersStr = localStorage.getItem("careloop_mock_users") || "[]";
        const users = JSON.parse(usersStr);

        const exists = users.some((u: any) => u.identifier.toLowerCase() === identifier.toLowerCase());
        if (exists) {
          return { success: false, message: "An account with this email/phone already exists." };
        }

        const hashed = await hashPassword(pass);
        const newUser = {
          id: generateUUID(),
          name,
          identifier,
          isPhone,
          hashedPassword: hashed,
        };

        users.push(newUser);
        localStorage.setItem("careloop_mock_users", JSON.stringify(users));

        // Auto login Sona
        const userSession = {
          id: newUser.id,
          email: !isPhone ? identifier : undefined,
          phone: isPhone ? identifier : undefined,
          user_metadata: {
            full_name: name,
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;

        setUser(userSession);
        localStorage.setItem("careloop_active_user", JSON.stringify(userSession));

        return { success: true, message: "Registration successful!" };
      } catch (e) {
        return { success: false, message: "Mock signup error." };
      }
    }
  };

  // Real world signin
  const signInUser = async (identifier: string, isPhone: boolean, pass: string) => {
    if (!isMockUser) {
      try {
        const loginParams = isPhone
          ? { phone: identifier, password: pass }
          : { email: identifier, password: pass };

        const { data, error } = await supabase.auth.signInWithPassword(loginParams);
        if (error) throw error;

        return { success: true, message: "Welcome back!" };
      } catch (err: any) {
        return { success: false, message: err.message || "Login failed." };
      }
    } else {
      // Mock Encrypted login
      try {
        // Allow fallback demo user instantly
        if (identifier === "sona@careloop.app" && pass === "sonalove") {
          const demoUser = {
            id: "d3b07384-d113-4ec6-a558-7e3077dd7d7b",
            email: "sona@careloop.app",
            user_metadata: { full_name: "Sona", role: "user" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User;
          setUser(demoUser);
          localStorage.setItem("careloop_active_user", JSON.stringify(demoUser));
          return { success: true, message: "Welcome back, Sona!" };
        }

        if (identifier === "vrushabh@careloop.app" && pass === "vrushabhlove") {
          const partnerUser = {
            id: "5f8288b8-0c6e-4e4b-b0b3-f6cd64d5ee2c",
            email: "vrushabh@careloop.app",
            user_metadata: { full_name: "Vrushabh", role: "partner" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User;
          setUser(partnerUser);
          localStorage.setItem("careloop_active_user", JSON.stringify(partnerUser));
          return { success: true, message: "Welcome back, Vrushabh!" };
        }

        const usersStr = localStorage.getItem("careloop_mock_users") || "[]";
        const users = JSON.parse(usersStr);

        const userAccount = users.find((u: any) => u.identifier.toLowerCase() === identifier.toLowerCase());
        if (!userAccount) {
          return { success: false, message: "No account found with this email/phone." };
        }

        const inputHashed = await hashPassword(pass);
        if (inputHashed !== userAccount.hashedPassword) {
          return { success: false, message: "Incorrect password." };
        }

        const userSession = {
          id: userAccount.id,
          email: !userAccount.isPhone ? userAccount.identifier : undefined,
          phone: userAccount.isPhone ? userAccount.identifier : undefined,
          user_metadata: {
            full_name: userAccount.name,
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;

        setUser(userSession);
        localStorage.setItem("careloop_active_user", JSON.stringify(userSession));

        return { success: true, message: "Welcome back!" };
      } catch (e) {
        return { success: false, message: "Mock login error." };
      }
    }
  };

  const signOut = async () => {
    if (isMockUser) {
      setUser(null);
      setSession(null);
      localStorage.removeItem("careloop_active_user");
      return;
    }
    await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: "google" | "apple", email?: string) => {
    if (!isMockUser) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
        return { success: true, message: `Redirecting to ${provider}...` };
      } catch (err: any) {
        return { success: false, message: err.message || `${provider} authentication failed.` };
      }
    } else {
      // Mock Encrypted localStorage oauth sign-in
      try {
        const isVrushabh = email === "vrushabh@careloop.app";
        const name = isVrushabh ? "Vrushabh" : (provider === "google" ? "Sona Andrews (Google)" : "Sona Andrews (Apple)");
        const userEmail = isVrushabh ? "vrushabh@careloop.app" : "sona@careloop.app";
        const role = isVrushabh ? "partner" : "user";
        
        const userSession = {
          id: isVrushabh ? "5f8288b8-0c6e-4e4b-b0b3-f6cd64d5ee2c" : "d3b07384-d113-4ec6-a558-7e3077dd7d7b",
          email: userEmail,
          user_metadata: {
            full_name: name,
            role: role,
            avatar_url: "",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;

        setUser(userSession);
        localStorage.setItem("careloop_active_user", JSON.stringify(userSession));
        return { success: true, message: `Successfully authenticated with ${provider === "google" ? "Google" : "Apple"}!` };
      } catch (e) {
        return { success: false, message: `Mock ${provider} authentication failed.` };
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isMockUser, signUpUser, signInUser, signOut, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
