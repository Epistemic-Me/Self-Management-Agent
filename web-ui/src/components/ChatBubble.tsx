'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

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
      'flex w-full gap-3',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && !isSystem && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-epistemic-cyan to-epistemic-cyan-dark flex items-center justify-center">
          <Bot className="w-4 h-4 text-background" />
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser 
          ? 'bg-gradient-to-br from-primary to-epistemic-cyan text-primary-foreground shadow-lg' 
          : isSystem
          ? 'bg-muted text-muted-foreground text-sm italic border border-border'
          : 'bg-card border border-epistemic-cyan/20 text-card-foreground shadow-sm'
      )}>
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        <div className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
} 