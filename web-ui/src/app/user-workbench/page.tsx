'use client';

import { useState } from 'react';
import { UserList } from '@/components/UserList';
import { UserProfilePane } from '@/components/UserProfilePane';
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
    <div className="flex h-full">
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold">Real Users</h1>
          <p className="text-sm text-muted-foreground">
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
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a user to view profile
          </div>
        )}
      </div>
    </div>
  );
} 