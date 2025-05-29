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
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-card">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-epistemic-cyan flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">E</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Epistemic Me
                  </h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Self-Management Agent
              </p>
              <p className="text-xs text-epistemic-cyan-light">
                Developer Playground
              </p>
            </div>
            <SidebarNav />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Top bar */}
            <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
              <div className="text-sm text-muted-foreground">
                <span className="text-epistemic-cyan">Build and evaluate</span> your AI agents with belief modeling
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Quantifying subjectivity in belief systems
                </div>
                <Avatar className="h-8 w-8 border border-epistemic-cyan">
                  <AvatarFallback className="bg-epistemic-cyan text-background">DV</AvatarFallback>
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