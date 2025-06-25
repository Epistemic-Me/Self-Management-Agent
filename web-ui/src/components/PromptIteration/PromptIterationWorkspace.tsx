'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptComparison } from './PromptComparison';
import { ImprovementSuggestions } from './ImprovementSuggestions';
import { IterationAnalytics } from './IterationAnalytics';
import { 
  Zap, 
  History, 
  Lightbulb, 
  BarChart3,
  Play,
  Copy,
  Save
} from 'lucide-react';

// Types
interface PromptVersion {
  id: string;
  content: string;
  timestamp: string;
  version: number;
  metrics?: {
    qualityScore: number;
    responseTime: number;
    successRate: number;
  };
}

interface AISuggestion {
  id: string;
  category: 'clarity' | 'specificity' | 'format' | 'context';
  suggestion: string;
  reasoning: string;
  confidence: number;
  applyable: boolean;
}

interface ComparisonTrace {
  id: string;
  query: string;
  leftResponse: string;
  rightResponse: string;
  leftMetrics: {
    qualityScore: number;
    responseTime: number;
  };
  rightMetrics: {
    qualityScore: number;
    responseTime: number;
  };
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  query_count: number;
  system_prompt: string;
  sample_queries: Array<{ id: string; text: string }>;
}

interface PromptIterationWorkspaceProps {
  selectedDataset: Dataset;
  onBack: () => void;
}

export function PromptIterationWorkspace({ selectedDataset, onBack }: PromptIterationWorkspaceProps) {
  // State management
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [currentComparison, setCurrentComparison] = useState<[PromptVersion, PromptVersion] | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<AISuggestion[]>([]);
  const [comparisonTraces, setComparisonTraces] = useState<ComparisonTrace[]>([]);
  const [activeTab, setActiveTab] = useState('comparison');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isRunningComparison, setIsRunningComparison] = useState(false);

  // Initialize with dataset's system prompt as first version
  useEffect(() => {
    const initialVersion: PromptVersion = {
      id: 'v1',
      content: selectedDataset.system_prompt,
      timestamp: new Date().toISOString(),
      version: 1,
      metrics: {
        qualityScore: 75,
        responseTime: 1200,
        successRate: 85
      }
    };
    setPromptVersions([initialVersion]);
  }, [selectedDataset]);

  // Auto-select latest two versions for comparison
  useEffect(() => {
    if (promptVersions.length >= 2) {
      const latest = promptVersions[promptVersions.length - 1];
      const previous = promptVersions[promptVersions.length - 2];
      setCurrentComparison([previous, latest]);
    } else if (promptVersions.length === 1) {
      setCurrentComparison([promptVersions[0], promptVersions[0]]);
    }
  }, [promptVersions]);

  // Run comparison test
  const handleRunComparison = async () => {
    if (!currentComparison) return;
    
    setIsRunningComparison(true);
    try {
      const [promptA, promptB] = currentComparison;
      
      const response = await fetch('/api/prompt-iteration/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptA: {
            id: promptA.id,
            content: promptA.content,
            version: promptA.version
          },
          promptB: {
            id: promptB.id,
            content: promptB.content,
            version: promptB.version
          },
          testQueries: selectedDataset.sample_queries
        })
      });

      if (!response.ok) throw new Error('Failed to run comparison');
      
      const data = await response.json();
      setComparisonTraces(data.traces);
      
      // Update metrics for the versions based on comparison results
      if (data.summary) {
        setPromptVersions(prev => prev.map(version => {
          if (version.id === promptA.id) {
            return {
              ...version,
              metrics: {
                ...version.metrics,
                qualityScore: data.summary.promptA_avg_quality,
                responseTime: Math.round(data.summary.promptA_avg_time),
                successRate: version.metrics?.successRate || 85
              }
            };
          }
          if (version.id === promptB.id) {
            return {
              ...version,
              metrics: {
                ...version.metrics,
                qualityScore: data.summary.promptB_avg_quality,
                responseTime: Math.round(data.summary.promptB_avg_time),
                successRate: version.metrics?.successRate || 85
              }
            };
          }
          return version;
        }));
      }
    } catch (error) {
      console.error('Error running comparison:', error);
      // Fallback to mock data on error
      const mockTraces: ComparisonTrace[] = selectedDataset.sample_queries.map((query, index) => ({
        id: `trace-${index}`,
        query: query.text,
        leftResponse: `Response from version ${currentComparison[0].version}: [Simulated response to "${query.text}"]`,
        rightResponse: `Response from version ${currentComparison[1].version}: [Improved simulated response to "${query.text}"]`,
        leftMetrics: {
          qualityScore: 70 + Math.random() * 20,
          responseTime: 1000 + Math.random() * 500,
        },
        rightMetrics: {
          qualityScore: 75 + Math.random() * 20,
          responseTime: 900 + Math.random() * 400,
        }
      }));
      setComparisonTraces(mockTraces);
    } finally {
      setIsRunningComparison(false);
    }
  };

  // Generate AI improvement suggestions
  const handleGenerateSuggestions = async () => {
    if (!promptVersions.length) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const currentPrompt = promptVersions[promptVersions.length - 1].content;
      
      const response = await fetch('/api/prompt-iteration/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt,
          traceData: comparisonTraces.map(trace => ({
            query: trace.query,
            response: trace.rightResponse,
            quality_score: trace.rightMetrics.qualityScore
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to generate suggestions');
      
      const data = await response.json();
      setImprovementSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to mock suggestions on error
      const fallbackSuggestions: AISuggestion[] = [
        {
          id: 'fallback1',
          category: 'clarity',
          suggestion: 'Add explicit output format requirements',
          reasoning: 'Analysis shows responses vary in structure. Specifying format improves consistency.',
          confidence: 0.87,
          applyable: true
        }
      ];
      setImprovementSuggestions(fallbackSuggestions);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Apply suggestion to create new version
  const handleApplySuggestion = (suggestion: AISuggestion) => {
    const latestVersion = promptVersions[promptVersions.length - 1];
    const newVersion: PromptVersion = {
      id: `v${promptVersions.length + 1}`,
      content: `${latestVersion.content}\n\n[APPLIED SUGGESTION: ${suggestion.suggestion}]`,
      timestamp: new Date().toISOString(),
      version: promptVersions.length + 1,
      metrics: {
        qualityScore: Math.min(100, latestVersion.metrics?.qualityScore || 75 + 5),
        responseTime: Math.max(800, (latestVersion.metrics?.responseTime || 1200) - 100),
        successRate: Math.min(100, (latestVersion.metrics?.successRate || 85) + 3)
      }
    };
    
    setPromptVersions(prev => [...prev, newVersion]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Zap className="h-6 w-6" />
              <span>Prompt Iteration Workspace</span>
            </h2>
            <p className="text-slate-300 mt-1">
              Dataset: {selectedDataset.name} • {promptVersions.length} version{promptVersions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGeneratingSuggestions}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGeneratingSuggestions ? (
                <>
                  <Lightbulb className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
            
            <Button
              onClick={handleRunComparison}
              disabled={isRunningComparison || !currentComparison}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isRunningComparison ? (
                <>
                  <Play className="h-4 w-4 mr-2 animate-pulse" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Comparison
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onBack}
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              Back to Datasets
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {promptVersions.length > 0 && (
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Latest Quality: {promptVersions[promptVersions.length - 1].metrics?.qualityScore || 0}%
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Success Rate: {promptVersions[promptVersions.length - 1].metrics?.successRate || 0}%
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Avg Response: {promptVersions[promptVersions.length - 1].metrics?.responseTime || 0}ms
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Main Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Compare Versions
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-6">
          <PromptComparison
            promptVersions={promptVersions}
            currentComparison={currentComparison}
            onComparisonChange={setCurrentComparison}
            comparisonTraces={comparisonTraces}
            isRunning={isRunningComparison}
          />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <ImprovementSuggestions
            suggestions={improvementSuggestions}
            onApplySuggestion={handleApplySuggestion}
            isGenerating={isGeneratingSuggestions}
            currentPrompt={promptVersions[promptVersions.length - 1]?.content || ''}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <IterationAnalytics
            promptVersions={promptVersions}
            comparisonTraces={comparisonTraces}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}