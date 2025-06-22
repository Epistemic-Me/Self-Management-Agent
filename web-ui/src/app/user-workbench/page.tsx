'use client';

import { useState } from 'react';
import { UserList } from '@/components/UserList';
import { UserProfilePane } from '@/components/UserProfilePane';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Settings, Calendar } from 'lucide-react';
import { enqueueSimulation } from '@/lib/api';
import type { ProfileUser, ChecklistItem } from '@/lib/api';

// Enhanced user type that includes checklist progress
type EnhancedUser = ProfileUser & { 
  checklist_progress: ChecklistItem[]; 
  completionPercentage: number; 
};

export default function UserWorkbenchPage() {
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);

  const handleSelectUser = (user: ProfileUser) => {
    // Cast to EnhancedUser since UserList actually provides enhanced users
    setSelectedUser(user as EnhancedUser);
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page header integrated with content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Workbench</h1>
          <p className="text-slate-400">
            Manage and analyze user profiles and behaviors
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Phase 2 Active</span>
          </Badge>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg border-2 border-cyan-400/50">
            <span className="text-white font-bold text-sm">DV</span>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-1">
        <div className="w-1/3 border-r border-white/10">
          <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm rounded-t-2xl">
            <h2 className="text-lg font-semibold text-white">Real Users</h2>
            <p className="text-sm text-slate-400">
              Developer user workbench
            </p>
          </div>
        <UserList 
          onSelectUser={handleSelectUser}
          selectedUser={selectedUser}
        />
      </div>
      
        <div className="flex-1">
          {selectedUser ? (
            <UserProfilePane user={selectedUser} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a user to view profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 