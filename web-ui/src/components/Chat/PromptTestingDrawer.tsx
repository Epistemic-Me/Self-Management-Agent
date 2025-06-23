'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Settings, 
  FileText, 
  Play, 
  Bot, 
  User, 
  ChevronRight,
  Copy,
  Edit
} from 'lucide-react';
import { getProjectState, getProjectSummary } from '@/lib/project-state';

interface PromptTestingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTestPrompt: (query: string) => void;
  className?: string;
}

export function PromptTestingDrawer({ 
  isOpen, 
  onClose, 
  onTestPrompt,
  className = "" 
}: PromptTestingDrawerProps) {
  const [projectState, setProjectState] = useState(getProjectState());
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  useEffect(() => {
    // Refresh project state when drawer opens
    if (isOpen) {
      setProjectState(getProjectState());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const promptData = projectState.projectData?.promptConfiguration;
  const projectSummary = getProjectSummary();
  
  // Extract sample queries from prompt templates
  const sampleQueries = [
    "I'm having trouble logging into my account",
    "Can you help me process a refund?", 
    "What's your return policy?",
    "How can I improve the performance of this code?",
    "Can you explain how photosynthesis works?",
    "I'm struggling with calculus derivatives"
  ];

  const handleTestQuery = (query: string) => {
    setSelectedQuery(query);
    onTestPrompt(query);
  };

  const handleCopyPrompt = async () => {
    if (promptData?.systemPrompt) {
      try {
        await navigator.clipboard.writeText(promptData.systemPrompt);
        // Could show a toast here
      } catch (error) {
        console.error('Failed to copy prompt:', error);
      }
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-slate-900/95 backdrop-blur-md border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Settings className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Prompt Testing</h2>
            <p className="text-sm text-slate-400">Test your AI configuration</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Project Info */}
        {projectSummary && (
          <Card className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">{projectSummary.name}</span>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {truncateText(projectSummary.description, 100)}
            </p>
          </Card>
        )}

        {/* Current Prompt */}
        {promptData && (
          <Card className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-green-400" />
                <span className="font-medium text-white">System Prompt</span>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <pre className={`text-xs text-slate-300 whitespace-pre-wrap font-mono ${showFullPrompt ? '' : 'max-h-32 overflow-hidden'}`}>
                {showFullPrompt 
                  ? promptData.systemPrompt 
                  : truncateText(promptData.systemPrompt, 200)
                }
              </pre>
              {promptData.systemPrompt.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2 p-0 h-auto"
                >
                  {showFullPrompt ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
            
            {promptData.description && (
              <p className="text-xs text-slate-400 mt-2">
                {promptData.description}
              </p>
            )}
          </Card>
        )}

        {/* Sample Queries */}
        <Card className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Play className="h-4 w-4 text-cyan-400" />
            <span className="font-medium text-white">Sample Queries</span>
          </div>
          
          <div className="space-y-2">
            {sampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleTestQuery(query)}
                className="w-full text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300 group-hover:text-white">
                      {query}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              Click any query to test it in the chat interface
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/5 border border-white/10 p-4">
          <h3 className="font-medium text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-white/10"
              onClick={() => window.open('/project-setup', '_blank')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Prompt Configuration
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-white/10"
              onClick={handleCopyPrompt}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy System Prompt
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}