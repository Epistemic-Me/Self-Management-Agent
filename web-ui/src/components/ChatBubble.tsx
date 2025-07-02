'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProvenanceDisplay } from '@/components/Chat/ProvenanceDisplay';
import type { Provenance } from '@/types/health-coach';

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provenance?: Provenance;
}

export function ChatBubble({ role, content, timestamp, provenance }: ChatBubbleProps) {
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
        <div className="leading-relaxed">
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for markdown elements to match chat bubble theme
                h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({children, inline}) => {
                  return inline 
                    ? <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-600">{children}</code>
                    : <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-600">{children}</code>;
                },
                pre: ({children}) => <pre className="bg-slate-800/50 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2 border border-slate-600">{children}</pre>,
                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 pl-4">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1 pl-4">{children}</ol>,
                li: ({children}) => <li className="text-sm">{children}</li>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-500/30 pl-4 italic mb-2 bg-slate-800/20 py-2 rounded-r">{children}</blockquote>,
                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                a: ({href, children}) => <a href={href} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
        <div className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
        
        {/* Show provenance for assistant messages */}
        {!isUser && !isSystem && provenance && (
          <ProvenanceDisplay provenance={provenance} compact />
        )}
      </div>
      
      {/* Expanded provenance for assistant messages */}
      {!isUser && !isSystem && provenance && (
        <div className="w-full">
          <ProvenanceDisplay provenance={provenance} />
        </div>
      )}

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
} 