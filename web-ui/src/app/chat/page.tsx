'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageInput } from '@/components/MessageInput';
import { ChatBubble } from '@/components/ChatBubble';
import { PromptTestingDrawer } from '@/components/Chat/PromptTestingDrawer';
import { ProvenanceBubble } from '@/components/Chat/ProvenanceBubble';
import { PromptConfigurationStep } from '@/components/ProjectSetup/PromptConfigurationStep';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Settings, Calendar, Bot, Sliders, MessageSquare, Wrench, Brain, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startConversation, appendTurn, getConversation } from '@/lib/api';
import { getProjectState, isProjectSetup } from '@/lib/project-state';
import { healthCoachService } from '@/lib/health-coach';
import type { ConversationDetail, Turn } from '@/lib/api';
import type { Cohort, HealthCoachResponse, Provenance, StreamMessage } from '@/types/health-coach';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [projectExists, setProjectExists] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [useHealthCoach, setUseHealthCoach] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<string>('health_enthusiast');
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [messageProvenances, setMessageProvenances] = useState<Map<string, Provenance>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [streamingTurns, setStreamingTurns] = useState<Array<{
    id: string;
    role: 'provenance' | 'assistant';
    content: string;
    timestamp: string;
    stages?: Array<{
      stage: string;
      description: string;
      data: any;
      timestamp: string;
      status: 'pending' | 'processing' | 'complete' | 'error';
    }>;
    isStreaming?: boolean;
  }>>([]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation?.turns, streamingTurns]);

  useEffect(() => {
    // Check if project exists and start conversation
    const initPage = async () => {
      // Check project state
      const exists = isProjectSetup();
      setProjectExists(exists);

      // Load system prompt from project state
      if (exists) {
        const projectState = getProjectState();
        const prompt = (projectState.projectData as any)?.promptConfiguration?.systemPrompt || '';
        setSystemPrompt(prompt);
      }

      // Load cohorts for Health Coach
      try {
        const cohorts = await healthCoachService.getCohorts();
        setAvailableCohorts(cohorts);
      } catch (error) {
        console.error('Failed to load cohorts:', error);
      }

      // Start a new conversation on mount
      try {
        const result = await startConversation();
        setConversationId(result.conversation_id);
        // Generate session ID for Health Coach
        setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initPage();
  }, []);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const conv = await getConversation(conversationId);
      setConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [conversationId]);

  useEffect(() => {
    // Load conversation when conversationId changes
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, loadConversation]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    let assistantResponse: string = '';
    let provenance: Provenance | undefined;

    try {
      // Add user message immediately to UI
      const userTurn: Turn = {
        id: `user_${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content: content,
        created_at: new Date().toISOString()
      };
      
      // Update local conversation state immediately
      setConversation(prev => prev ? {
        ...prev,
        turns: [...prev.turns, userTurn]
      } : null);
      
      // Clear any previous streaming turns for new conversation
      setStreamingTurns([]);
      
      // Clear the message input immediately
      setCurrentMessage('');
      
      // Add to backend asynchronously
      appendTurn(conversationId, 'user', content);
      
      if (useHealthCoach) {
        // Use Health Coach Agent with streaming
        try {
          setIsStreaming(true);
          setStreamingTurns([]);
          
          let provenanceStages: Array<any> = [];
          let provenanceTurnId: string | null = null;
          let responseTurnId: string | null = null;
          
          await healthCoachService.sendMessageStream({
            message: content,
            user_id: 'demo_user', // TODO: Get from auth
            session_id: sessionId,
            cohort: selectedCohort,
            context: {
              conversation_history: conversation?.turns.slice(-5) || [] // Last 5 messages for context
            },
            include_provenance: true
          }, (streamMessage: StreamMessage) => {
            if (streamMessage.type === 'provenance' && streamMessage.stage && streamMessage.data) {
              const stageData = {
                stage: streamMessage.stage,
                description: streamMessage.data.description || `Processing ${streamMessage.stage}`,
                data: streamMessage.data,
                timestamp: streamMessage.timestamp,
                status: 'processing' as const
              };
              
              provenanceStages.push(stageData);
              
              // Create or update provenance turn
              if (!provenanceTurnId) {
                provenanceTurnId = `provenance_${Date.now()}`;
                setStreamingTurns([{
                  id: provenanceTurnId,
                  role: 'provenance',
                  content: '',
                  timestamp: new Date().toISOString(),
                  stages: [stageData],
                  isStreaming: true
                }]);
              } else {
                setStreamingTurns(prev => prev.map(turn => 
                  turn.id === provenanceTurnId ? {
                    ...turn,
                    stages: [...(turn.stages || []), stageData]
                  } : turn
                ));
              }
            } else if (streamMessage.type === 'response_chunk' && streamMessage.chunk) {
              // Create or update response turn
              if (!responseTurnId) {
                responseTurnId = `response_${Date.now()}`;
                const newResponseTurnId = responseTurnId;
                setStreamingTurns(prev => [...prev, {
                  id: newResponseTurnId,
                  role: 'assistant',
                  content: streamMessage.chunk || '',
                  timestamp: new Date().toISOString(),
                  isStreaming: true
                }]);
              } else {
                setStreamingTurns(prev => prev.map(turn => 
                  turn.id === responseTurnId ? {
                    ...turn,
                    content: turn.content + streamMessage.chunk
                  } : turn
                ));
              }
            } else if (streamMessage.type === 'response_complete' && streamMessage.content) {
              assistantResponse = streamMessage.content;
              
              // Mark response turn as complete
              setStreamingTurns(prev => prev.map(turn => 
                turn.id === responseTurnId ? {
                  ...turn,
                  content: streamMessage.content || '',
                  isStreaming: false
                } : turn
              ));
            } else if (streamMessage.type === 'complete') {
              setIsStreaming(false);
              // Keep streaming turns visible as conversation history
              // Don't add to backend conversation - streaming turns are the source of truth
            } else if (streamMessage.type === 'error') {
              console.error('Health Coach stream error:', streamMessage.error);
              assistantResponse = 'Sorry, I encountered an error with the Health Coach. Please try again.';
              setIsStreaming(false);
              setStreamingTurns([]);
            }
          });

        } catch (error) {
          console.error('Health Coach error:', error);
          assistantResponse = 'Sorry, I encountered an error with the Health Coach. Please try again.';
          setIsStreaming(false);
          setStreamingTurns([]);
        }
      } else if (projectExists) {
        // Use traditional prompt testing
        const projectState = getProjectState();
        const systemPrompt = (projectState.projectData as any)?.promptConfiguration?.systemPrompt;
        
        if (systemPrompt) {
          try {
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
      
      // Only add assistant message for non-Health Coach responses
      if (!useHealthCoach && assistantResponse) {
        await appendTurn(conversationId, 'assistant', assistantResponse);
        // Reload conversation for non-streaming responses
        await loadConversation();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrompt = (query: string) => {
    // Close drawer and populate the input field
    setIsDrawerOpen(false);
    setCurrentMessage(query);
    
    // Clear any previous streaming turns
    setStreamingTurns([]);
    
    // Focus the input field so user can see the populated query
    setTimeout(() => {
      const inputElement = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const handleSavePrompt = () => {
    // Save prompt to project state
    const projectState = getProjectState();
    if (projectState.projectData) {
      // We need to save the full project state, not use updateProjectState
      // Since promptConfiguration is not part of ProjectFormData
      const updatedState = {
        ...projectState,
        projectData: {
          ...projectState.projectData,
          promptConfiguration: {
            systemPrompt,
            description: 'User configured prompt',
            version: '1.0'
          }
        } as any,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem('epistemic_me_project', JSON.stringify(updatedState));
    }
  };

  const handleSystemPromptChange = (prompt: string) => {
    setSystemPrompt(prompt);
    // Auto-save after a short delay
    setTimeout(() => handleSavePrompt(), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page header integrated with content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Chat & Prompt Management</h1>
          <p className="text-slate-400">
            Configure your AI assistant and <span className="text-cyan-400">test prompts</span> in real-time
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Phase 2 Active</span>
          </Badge>
          
          {/* Health Coach Toggle */}
          <Button 
            variant={useHealthCoach ? "default" : "outline"}
            size="sm" 
            onClick={() => setUseHealthCoach(!useHealthCoach)}
            className={useHealthCoach 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "text-slate-300 hover:text-white border-slate-600 hover:border-green-500 hover:bg-green-500/10"
            }
          >
            <Brain className="h-4 w-4 mr-2" />
            Health Coach {useHealthCoach ? 'ON' : 'OFF'}
          </Button>

          {/* Cohort Selection */}
          {useHealthCoach && (
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger className="w-48 border-slate-600 bg-slate-800/50">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select cohort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableCohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {(projectExists || useHealthCoach) && (
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setIsDrawerOpen(true)}
              className="text-slate-300 hover:text-white border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
            >
              <Sliders className="h-4 w-4 mr-2" />
              {useHealthCoach ? 'Test Health Coach' : 'Test Prompt'}
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

      {/* Tabs for Chat and Prompt Configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Prompt Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
          {/* Chat Messages - Fixed height with scroll */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4" 
            style={{maxHeight: 'calc(100vh - 250px)'}}
          >
        {conversation?.turns.map((turn: Turn, index: number) => {
          return (
            <ChatBubble
              key={turn.id}
              role={turn.role}
              content={turn.content}
              timestamp={turn.created_at}
              provenance={undefined}
            />
          );
        })}
        
        {/* Current streaming turns */}
        {streamingTurns.map((turn) => (
          turn.role === 'provenance' ? (
            <ProvenanceBubble
              key={turn.id}
              stages={turn.stages || []}
              timestamp={turn.timestamp}
            />
          ) : (
            <ChatBubble
              key={turn.id}
              role="assistant"
              content={turn.content}
              timestamp={turn.timestamp}
            />
          )
        ))}
        
        {conversation?.turns.length === 0 && streamingTurns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-epistemic-cyan to-epistemic-cyan-dark flex items-center justify-center mb-4">
              {useHealthCoach ? (
                <Brain className="w-8 h-8 text-background" />
              ) : (
                <span className="text-2xl font-bold text-background">E</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {useHealthCoach ? 'AI Health Coach' : 'Welcome to Epistemic Me'}
            </h3>
            <p className="text-center text-muted-foreground max-w-md">
              {useHealthCoach 
                ? `Start a conversation with your ${availableCohorts.find(c => c.id === selectedCohort)?.name || 'health coach'}. I'll provide personalized guidance with full provenance tracking showing my reasoning process.`
                : 'Start a conversation and experience AI that understands your unique beliefs and perspectives. This system quantifies subjectivity to provide truly personalized interactions.'
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {useHealthCoach ? (
                <>
                  <span className="px-3 py-1 text-xs bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                    Hierarchical Constraints
                  </span>
                  <span className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                    Provenance Tracking
                  </span>
                  <span className="px-3 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                    Intent Classification
                  </span>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                    Belief Modeling
                  </span>
                  <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                    Personalization
                  </span>
                  <span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
                    Subjectivity Analysis
                  </span>
                </>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Fixed Input at Bottom */}
          <div className="sticky bottom-0 bg-inherit pt-4">
            <MessageInput 
              onSend={handleSendMessage} 
              disabled={isLoading || isStreaming}
              value={currentMessage}
              onChange={setCurrentMessage}
            />
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="flex-1 mt-4">
          <Card className="h-full">
            <div className="p-6">
              <PromptConfigurationStep
                systemPrompt={systemPrompt}
                onSystemPromptChange={handleSystemPromptChange}
                onSave={handleSavePrompt}
                onContinueToEvaluation={() => {
                  // Navigate to evaluation page when this is implemented
                }}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prompt Testing Drawer */}
      <PromptTestingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTestPrompt={handleTestPrompt}
        useHealthCoach={useHealthCoach}
        selectedCohort={selectedCohort}
      />
    </div>
  );
} 