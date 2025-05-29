'use client';

import { useEffect, useState } from 'react';
import { getConversation } from '@/lib/api';
import type { Conversation, ConversationDetail as ConversationDetailType } from '@/lib/api';
import { ChatBubble } from '@/components/ChatBubble';
import { RadarMetrics } from '@/components/RadarMetrics';
import { BeliefMap } from '@/components/BeliefMap';

interface ConversationDetailProps {
  conversation: Conversation;
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  const [detail, setDetail] = useState<ConversationDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await getConversation(conversation.id);
        setDetail(data);
      } catch (error) {
        console.error('Failed to load conversation detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [conversation.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Failed to load conversation</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Conversation Detail</h2>
        <p className="text-sm text-muted-foreground">
          Started {new Date(detail.started_at).toLocaleString()}
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {detail.turns.map((turn) => (
            <ChatBubble
              key={turn.id}
              role={turn.role}
              content={turn.content}
              timestamp={turn.created_at}
            />
          ))}
        </div>

        {/* Sidebar with metrics and beliefs */}
        <div className="w-80 border-l border-border overflow-y-auto">
          {detail.metrics && (
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold mb-3">Metrics</h3>
              <RadarMetrics metrics={detail.metrics} />
            </div>
          )}

          {detail.belief_map && (
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Belief Map</h3>
              <BeliefMap beliefMap={detail.belief_map} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 