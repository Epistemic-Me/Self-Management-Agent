'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, BarChart3, Users, Rocket } from 'lucide-react';

const navItems = [
  {
    title: 'Client Portal',
    href: '/client-portal',
    icon: Rocket,
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
    <nav className="p-4 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
} 