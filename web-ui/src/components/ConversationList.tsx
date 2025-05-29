'use client';

import { useEffect, useState } from 'react';
import { listConversations } from '@/lib/api';
import type { Conversation } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversation: Conversation | null;
}

export function ConversationList({ onSelectConversation, selectedConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await listConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Reviewed': return 'bg-green-500';
      case 'Edited': return 'bg-blue-500';
      case 'Simulating': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={cn(
            'p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors',
            selectedConversation?.id === conversation.id && 'bg-accent'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium truncate">
              {conversation.last_turn || 'New conversation'}
            </div>
            <div className={cn(
              'w-2 h-2 rounded-full',
              getStatusColor(conversation.status)
            )} />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{conversation.turn_count || 0} turns</span>
            <span>{new Date(conversation.started_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
      
      {conversations.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          No conversations found
        </div>
      )}
    </div>
  );
} 