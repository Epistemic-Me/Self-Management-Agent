import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/SidebarNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Self-Management Agent",
  description: "Developer & User UI for the Self-Management Agent",
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
              <h1 className="text-lg font-semibold text-foreground">
                Self-Management Agent
              </h1>
              <p className="text-sm text-muted-foreground">
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
                Build and evaluate your AI agents
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>DV</AvatarFallback>
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