'use client';

import { useState, useEffect } from 'react';
import { MessageInput } from '@/components/MessageInput';
import { ChatBubble } from '@/components/ChatBubble';
import { startConversation, appendTurn, getConversation } from '@/lib/api';
import type { ConversationDetail, Turn } from '@/lib/api';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Start a new conversation on mount
    const initConversation = async () => {
      try {
        const result = await startConversation();
        setConversationId(result.conversation_id);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initConversation();
  }, []);

  useEffect(() => {
    // Load conversation when conversationId changes
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    if (!conversationId) return;
    
    try {
      const conv = await getConversation(conversationId);
      setConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      // Add user message
      await appendTurn(conversationId, 'user', content);
      
      // Simulate assistant response (placeholder)
      const assistantResponse = `I understand you said: "${content}". This is a placeholder response. In a real implementation, this would be connected to your AI agent.`;
      
      // Add assistant message
      await appendTurn(conversationId, 'assistant', assistantResponse);
      
      // Reload conversation
      await loadConversation();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-white">Chat Interface</h1>
        <p className="text-sm text-slate-400">
          Conversational AI with <span className="text-cyan-400">belief modeling</span> and personalization
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation?.turns.map((turn: Turn) => (
          <ChatBubble
            key={turn.id}
            role={turn.role}
            content={turn.content}
            timestamp={turn.created_at}
          />
        ))}
        
        {conversation?.turns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-epistemic-cyan to-epistemic-cyan-dark flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-background">E</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to Epistemic Me
            </h3>
            <p className="text-center text-muted-foreground max-w-md">
              Start a conversation and experience AI that understands your unique beliefs and perspectives. 
              This system quantifies subjectivity to provide truly personalized interactions.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                Belief Modeling
              </span>
              <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                Personalization
              </span>
              <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                Subjectivity Analysis
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card/50">
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
} 