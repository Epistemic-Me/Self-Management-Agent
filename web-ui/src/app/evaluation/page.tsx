'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/ConversationList';
import { ConversationDetail } from '@/components/ConversationDetail';
import type { Conversation } from '@/lib/api';

export default function EvaluationPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold">Conversation Dataset</h1>
          <p className="text-sm text-muted-foreground">
            Developer evaluation view
          </p>
        </div>
        <ConversationList 
          onSelectConversation={setSelectedConversation}
          selectedConversation={selectedConversation}
        />
      </div>
      
      <div className="flex-1">
        {selectedConversation ? (
          <ConversationDetail conversation={selectedConversation} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to view details
          </div>
        )}
      </div>
    </div>
  );
} 