'use client';

import { useState, useEffect } from 'react';
import { MessageInput } from '@/components/MessageInput';
import { ChatBubble } from '@/components/ChatBubble';
import { PromptTestingDrawer } from '@/components/Chat/PromptTestingDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Settings, Calendar, Bot, Sliders } from 'lucide-react';
import { startConversation, appendTurn, getConversation } from '@/lib/api';
import { getProjectState, isProjectSetup } from '@/lib/project-state';
import type { ConversationDetail, Turn } from '@/lib/api';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [projectExists, setProjectExists] = useState(false);

  useEffect(() => {
    // Check if project exists and start conversation
    const initPage = async () => {
      // Check project state
      const exists = isProjectSetup();
      setProjectExists(exists);

      // Start a new conversation on mount
      try {
        const result = await startConversation();
        setConversationId(result.conversation_id);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initPage();
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
      
      // If project exists, use the configured prompt for testing
      let assistantResponse: string;
      
      if (projectExists) {
        // Test with the actual configured prompt
        const projectState = getProjectState();
        const systemPrompt = projectState.projectData?.promptConfiguration?.systemPrompt;
        
        if (systemPrompt) {
          try {
            // Call our prompt testing API
            const response = await fetch('/api/prompt-test/test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                system_prompt: systemPrompt,
                user_message: content,
                conversation_history: conversation?.turns.map(turn => ({
                  role: turn.role,
                  content: turn.content
                })) || []
              }),
            });

            if (response.ok) {
              const result = await response.json();
              assistantResponse = result.success ? result.response : `Error: ${result.error}`;
            } else {
              assistantResponse = `API Error: ${response.status}`;
            }
          } catch (error) {
            console.error('Prompt testing failed:', error);
            assistantResponse = 'Sorry, I encountered an error while processing your message.';
          }
        } else {
          assistantResponse = 'No system prompt configured. Please set up your project first.';
        }
      } else {
        // Fallback placeholder response
        assistantResponse = `I understand you said: "${content}". This is a placeholder response. Please configure your project first to test with your custom AI prompt.`;
      }
      
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

  const handleTestPrompt = (query: string) => {
    // Close drawer and send the query
    setIsDrawerOpen(false);
    handleSendMessage(query);
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page header integrated with content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Chat Interface</h1>
          <p className="text-slate-400">
            Conversational AI with <span className="text-cyan-400">belief modeling</span> and personalization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Phase 2 Active</span>
          </Badge>
          {projectExists && (
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setIsDrawerOpen(true)}
              className="text-slate-300 hover:text-white border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
            >
              <Sliders className="h-4 w-4 mr-2" />
              Test Prompt
            </Button>
          )}
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

      <div className="flex-1 overflow-y-auto space-y-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
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

      <div className="mt-4">
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>

      {/* Prompt Testing Drawer */}
      <PromptTestingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTestPrompt={handleTestPrompt}
      />
    </div>
  );
} 