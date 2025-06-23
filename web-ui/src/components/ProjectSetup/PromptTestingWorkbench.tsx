'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Send, Play, Save, ArrowRight, MessageCircle, Bot } from 'lucide-react';

interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface PromptTestingWorkbenchProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onSave?: () => void;
  onContinueToEvaluation?: () => void;
  className?: string;
  sampleQueries?: string[];
  selectedSampleQuery?: string;
  onSampleQueryUsed?: () => void;
}

export function PromptTestingWorkbench({
  systemPrompt,
  onSystemPromptChange,
  onSave,
  onContinueToEvaluation,
  className = "",
  sampleQueries = [],
  selectedSampleQuery = "",
  onSampleQueryUsed
}: PromptTestingWorkbenchProps) {
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promptDescription, setPromptDescription] = useState('');
  const { toast } = useToast();

  // Handle selected sample query from template cards
  useEffect(() => {
    if (selectedSampleQuery) {
      setCurrentMessage(selectedSampleQuery);
      if (onSampleQueryUsed) {
        onSampleQueryUsed();
      }
    }
  }, [selectedSampleQuery, onSampleQueryUsed]);

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !systemPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a system prompt and test message",
        variant: "destructive",
      });
      return;
    }

    const userMessage: TestMessage = {
      id: `user-${Date.now()}`,
      content: currentMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setTestMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = testMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call real OpenAI API
      const response = await fetch('/api/prompt-test/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          user_message: messageToSend,
          conversation_history: conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const assistantMessage: TestMessage = {
          id: `assistant-${Date.now()}`,
          content: result.response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setTestMessages(prev => [...prev, assistantMessage]);
        
        toast({
          title: "Response Generated",
          description: "AI response received successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to generate response');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate response',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentMessage, systemPrompt, testMessages, toast]);

  const handleClearMessages = () => {
    setTestMessages([]);
    toast({
      title: "Messages Cleared",
      description: "Test conversation has been reset",
    });
  };

  const handleSampleQueryClick = (query: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setCurrentMessage(query);
  };

  const handleSavePrompt = async () => {
    if (!systemPrompt.trim()) {
      toast({
        title: "Cannot Save",
        description: "Please enter a system prompt before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          description: promptDescription,
          version: 'v1.0',
        }),
      });

      if (response.ok) {
        if (onSave) {
          onSave();
        }
        toast({
          title: "Prompt Saved",
          description: "Your prompt configuration has been saved",
        });
      } else {
        throw new Error('Failed to save prompt');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Prompt Configuration Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Prompt Configuration</h3>
            <Badge variant="secondary">
              v1.0
            </Badge>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt *
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]"
              placeholder="Enter your system prompt here. This defines how the AI should behave and respond to users..."
              data-testid="system-prompt-input"
            />
            <p className="text-sm text-gray-400 mt-1">
              {systemPrompt.length} characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of this prompt's purpose"
              data-testid="prompt-description"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleSavePrompt}
              variant="outline"
              className="flex-1"
              disabled={!systemPrompt.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Prompt
            </Button>
          </div>
        </div>
      </Card>

      {/* Testing Interface Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Test Your Prompt</h3>
            <div className="flex space-x-2">
              <Button
                onClick={handleClearMessages}
                variant="ghost"
                size="sm"
                disabled={testMessages.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-gray-800 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {testMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Send a test message to see how your prompt performs</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {testMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.role === 'user' ? (
                          <span className="text-sm font-medium">You</span>
                        ) : (
                          <>
                            <Bot className="h-4 w-4" />
                            <span className="text-sm font-medium">Assistant</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isProcessing && (
              <div className="flex justify-start mt-4">
                <div className="bg-gray-700 text-gray-100 max-w-[80%] p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sample Queries */}
          {sampleQueries.length > 0 && testMessages.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Try these sample queries:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleSampleQueryClick(query, e)}
                    className="px-3 py-1 text-sm bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-md hover:bg-blue-600/30 transition-colors"
                    data-testid={`sample-query-${index}`}
                  >
                    "{query}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type a test message..."
              disabled={isProcessing || !systemPrompt.trim()}
              data-testid="test-message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !currentMessage.trim() || !systemPrompt.trim()}
              data-testid="send-test-message"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Evaluation Transition */}
          {testMessages.length > 0 && onContinueToEvaluation && (
            <div className="pt-4 border-t border-gray-600">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-300">Ready for Evaluation</h4>
                    <p className="text-sm text-blue-200 mt-1">
                      You've tested your prompt! Continue to full evaluation mode.
                    </p>
                  </div>
                  <Button
                    onClick={onContinueToEvaluation}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="continue-to-evaluation"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Evaluate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}