import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/SidebarNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Epistemic Me | Self-Management Agent",
  description: "Developer & User UI for the Self-Management Agent - Quantifying subjectivity in belief systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          {/* Global glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-3xl" />
          
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    Epistemic Me
                  </h1>
                </div>
              </div>
              <p className="text-slate-300 text-sm">
                Self-Management Agent
              </p>
              <p className="text-cyan-400 text-xs font-medium">
                Developer Playground
              </p>
            </div>
            <SidebarNav />
            
            {/* Footer tagline */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-slate-500 text-xs text-center">
                Quantifying subjectivity in belief systems
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col relative z-10">
            {/* Top bar */}
            <div className="h-14 border-b border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between px-6">
              <div className="text-sm text-slate-300">
                <span className="text-cyan-400 font-medium">Build and evaluate</span> your AI agents with belief modeling
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400 hidden sm:block">
                  Quantifying subjectivity in belief systems
                </div>
                <Avatar className="h-8 w-8 border-2 border-cyan-400 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-semibold">DV</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
} 