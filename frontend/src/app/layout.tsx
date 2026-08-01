import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { PWARegister } from "@/components/pwa-register";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CareLoop — Wellness, Habits & Reminders ❤️",
  description: "A premium, delightful wellness space to track habits, manage nutrition, and receive cute encouragement from those who care.",
  manifest: "/manifest.json", // Supports future PWA requirements
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} dark`}>
      <body className="antialiased min-h-screen bg-[#0B0A0F] text-[#F3F1F6] selection:bg-[#FF7597]/30 selection:text-[#FF7597]">
        {/* Ambient Aurora Gradient backgrounds */}
        <div className="aurora-bg">
          <div className="aurora-glow-1"></div>
          <div className="aurora-glow-2"></div>
        </div>
        
        {/* Main layout container */}
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <AuthProvider>
            <PWARegister />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
