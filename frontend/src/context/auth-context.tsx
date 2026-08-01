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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isMockUser: false,
  signUpUser: async () => ({ success: false, message: "" }),
  signInUser: async () => ({ success: false, message: "" }),
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
        // Initial default demo user Sona
        setUser({
          id: "d3b07384-d113-4ec6-a558-7e3077dd7d7b",
          email: "sona@careloop.app",
          user_metadata: {
            full_name: "Sona",
            avatar_url: "",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User);
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
          id: Date.now().toString(),
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
            user_metadata: { full_name: "Sona" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User;
          setUser(demoUser);
          localStorage.setItem("careloop_active_user", JSON.stringify(demoUser));
          return { success: true, message: "Welcome back, Sona!" };
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

  return (
    <AuthContext.Provider value={{ user, session, loading, isMockUser, signUpUser, signInUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
