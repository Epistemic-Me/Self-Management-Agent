'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, BarChart3, Users, Rocket, FileText, Upload } from 'lucide-react';

const navItems = [
  {
    title: 'Client Portal',
    href: '/client-portal',
    icon: Rocket,
  },
  {
    title: 'Project Setup',
    href: '/project-setup',
    icon: FileText,
  },
  {
    title: 'Trace Collection',
    href: '/trace-collection',
    icon: Upload,
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    title: 'Evaluation',
    href: '/evaluation',
    icon: BarChart3,
  },
  {
    title: 'User Workbench',
    href: '/user-workbench',
    icon: Users,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="p-4 space-y-3 flex-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
} 