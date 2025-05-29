'use client';

import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div className={cn(
      'flex w-full',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : isSystem
          ? 'bg-muted text-muted-foreground text-sm italic'
          : 'bg-card border border-border text-card-foreground'
      )}>
        <div className="whitespace-pre-wrap">{content}</div>
        <div className={cn(
          'text-xs mt-1 opacity-70',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 