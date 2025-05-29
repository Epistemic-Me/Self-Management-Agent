'use client';

import { useEffect, useState } from 'react';
import { listUsers, getUserChecklistProgress } from '@/lib/api';
import type { ProfileUser, ChecklistItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserListProps {
  onSelectUser: (user: ProfileUser) => void;
  selectedUser: ProfileUser | null;
}

interface EnhancedUser extends ProfileUser {
  checklist_progress: ChecklistItem[];
  completionPercentage: number;
}

export function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await listUsers();
        
        // Enhance users with real checklist progress
        const enhancedUsers = await Promise.all(
          userData.map(async (user) => {
            try {
              // Fetch real checklist progress for each user
              const checklistProgress = await getUserChecklistProgress(user.user_id);
              
              const completedCount = checklistProgress.filter(item => item.status === 'completed').length;
              const completionPercentage = Math.round((completedCount / checklistProgress.length) * 100);
              
              return {
                ...user,
                checklist_progress: checklistProgress,
                completionPercentage
              };
            } catch (error) {
              console.error(`Failed to load checklist for user ${user.user_id}:`, error);
              // Fallback to empty checklist on error
              return {
                ...user,
                checklist_progress: [],
                completionPercentage: 0
              };
            }
          })
        );
        
        setUsers(enhancedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatBucketLabel = (bucketCode: string) => {
    const labels: Record<string, string> = {
      'health_device': 'Health Device',
      'dd_score': "Don't Die Score",
      'measurements': 'Measurements',
      'capabilities': 'Capabilities',
      'biomarkers': 'Biomarkers',
      'demographics': 'Demographics',
      'protocols': 'Protocols',
    };
    return labels[bucketCode] || bucketCode;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {users.map((user) => (
        <div
          key={user.user_id}
          data-testid="user-item"
          onClick={() => onSelectUser(user)}
          className={cn(
            'p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors',
            selectedUser?.user_id === user.user_id && 'bg-accent'
          )}
        >
          <div className="mb-2">
            <div className="font-medium text-sm">
              Don't Die User
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {user.user_id.substring(0, 8)}...
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="mb-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Onboarding Progress: {user.completionPercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${user.completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {user.checklist_progress.slice(0, 3).map((item) => (
              <span
                key={item.bucket_code}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  getStatusColor(item.status)
                )}
              >
                {formatBucketLabel(item.bucket_code)}
              </span>
            ))}
            {user.checklist_progress.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                +{user.checklist_progress.length - 3} more
              </span>
            )}
          </div>
        </div>
      ))}
      
      {users.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  );
} 