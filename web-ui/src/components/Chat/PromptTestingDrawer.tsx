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
  Edit,
  Brain,
  Target
} from 'lucide-react';
import { getProjectState, getProjectSummary } from '@/lib/project-state';

interface PromptTestingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTestPrompt: (query: string) => void;
  className?: string;
  useHealthCoach?: boolean;
  selectedCohort?: string;
}

export function PromptTestingDrawer({ 
  isOpen, 
  onClose, 
  onTestPrompt,
  className = "",
  useHealthCoach = false,
  selectedCohort = "health_enthusiast"
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
  
  // Health Coach sample queries by cohort and category
  const healthCoachQueries = {
    sedentary_beginner: {
      "Exercise": [
        "I want to start exercising but don't know where to begin",
        "What's a simple workout routine for someone who's never exercised?",
        "How often should a beginner exercise per week?",
        "I'm afraid of going to the gym, what can I do at home?"
      ],
      "Nutrition": [
        "How do I start eating healthier?",
        "What are some simple meal ideas for weight loss?",
        "I eat a lot of fast food, how can I change this?",
        "What should I know about calories and portion sizes?"
      ],
      "Sleep": [
        "I have trouble falling asleep at night",
        "How many hours of sleep do I need?",
        "What's a good bedtime routine for better sleep?",
        "Why do I feel tired even after sleeping 8 hours?"
      ]
    },
    health_enthusiast: {
      "Exercise": [
        "How can I optimize my current workout routine?",
        "What does research say about training frequency for muscle growth?",
        "Should I do cardio before or after weight training?",
        "How do I break through a fitness plateau?"
      ],
      "Nutrition": [
        "What's the optimal protein intake for muscle building?",
        "How should I time my meals around workouts?",
        "What does research say about intermittent fasting?",
        "Should I take supplements, and if so, which ones?"
      ],
      "Sleep": [
        "How does sleep affect my workout recovery?",
        "What's the relationship between sleep and muscle growth?",
        "How can I improve my sleep quality?",
        "Is it better to workout in the morning or evening for sleep?"
      ]
    },
    optimizer: {
      "Exercise": [
        "Based on my HRV data, how should I adjust my training?",
        "What metrics should I track for optimal performance?",
        "How do I periodize my training for peak performance?",
        "What does the research say about training volume vs intensity?"
      ],
      "Nutrition": [
        "How can I optimize my macronutrient ratios based on my goals?",
        "What biomarkers should I track for metabolic health?",
        "How do I time my nutrition for optimal performance and recovery?",
        "What's the latest research on nutrient timing?"
      ],
      "Sleep": [
        "How can I use sleep tracking data to optimize my recovery?",
        "What's the relationship between sleep stages and performance?",
        "How do I optimize my sleep environment using data?",
        "What sleep metrics correlate best with next-day performance?"
      ]
    },
    biohacker: {
      "Exercise": [
        "What are the latest protocols for enhancing mitochondrial function?",
        "How can I use cold exposure to optimize my training adaptations?",
        "What's the cutting-edge research on exercise and longevity?",
        "How do I implement advanced recovery modalities?"
      ],
      "Nutrition": [
        "What are the latest findings on time-restricted eating windows?",
        "How can I optimize my microbiome for performance?",
        "What's the research on ketosis and cognitive performance?",
        "How do I implement continuous glucose monitoring for optimization?"
      ],
      "Sleep": [
        "What are the latest sleep optimization technologies and protocols?",
        "How can I hack my circadian rhythm for peak performance?",
        "What's the research on polyphasic sleep schedules?",
        "How do I use light therapy and temperature manipulation?"
      ]
    }
  };

  // Traditional prompt testing queries
  const traditionalQueries = [
    "I'm having trouble logging into my account",
    "Can you help me process a refund?", 
    "What's your return policy?",
    "How can I improve the performance of this code?",
    "Can you explain how photosynthesis works?",
    "I'm struggling with calculus derivatives"
  ];

  // Get appropriate sample queries
  const getSampleQueries = () => {
    if (useHealthCoach) {
      const cohortQueries = healthCoachQueries[selectedCohort as keyof typeof healthCoachQueries];
      if (cohortQueries) {
        // Flatten all categories for the selected cohort
        return Object.values(cohortQueries).flat();
      }
      // Fallback to health enthusiast if cohort not found
      return Object.values(healthCoachQueries.health_enthusiast).flat();
    }
    return traditionalQueries;
  };

  const sampleQueries = getSampleQueries();

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
          <div className={`p-2 rounded-lg ${useHealthCoach ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
            {useHealthCoach ? (
              <Brain className="h-5 w-5 text-green-400" />
            ) : (
              <Settings className="h-5 w-5 text-purple-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {useHealthCoach ? 'Health Coach Testing' : 'Prompt Testing'}
            </h2>
            <p className="text-sm text-slate-400">
              {useHealthCoach 
                ? `Test AI Health Coach (${selectedCohort.replace('_', ' ')})` 
                : 'Test your AI configuration'
              }
            </p>
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

        {/* Current Configuration */}
        {(useHealthCoach || promptData) && (
          <Card className="bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {useHealthCoach ? (
                  <Target className="h-4 w-4 text-green-400" />
                ) : (
                  <Bot className="h-4 w-4 text-green-400" />
                )}
                <span className="font-medium text-white">
                  {useHealthCoach ? 'Health Coach Configuration' : 'System Prompt'}
                </span>
              </div>
              {!useHealthCoach && (
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
              )}
            </div>
            
            {useHealthCoach ? (
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Cohort:</span>
                      <div className="text-green-400 font-medium">
                        {selectedCohort.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Mode:</span>
                      <div className="text-cyan-400 font-medium">
                        HIERARCHICAL ROUTING
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Health Coach uses hierarchical constraint architecture for systematic evaluation
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <pre className={`text-xs text-slate-300 whitespace-pre-wrap font-mono ${showFullPrompt ? '' : 'max-h-32 overflow-hidden'}`}>
                  {showFullPrompt 
                    ? promptData?.systemPrompt 
                    : truncateText(promptData?.systemPrompt || '', 200)
                  }
                </pre>
                {(promptData?.systemPrompt?.length || 0) > 200 && (
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
            )}
            
            {!useHealthCoach && promptData?.description && (
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
            <span className="font-medium text-white">
              {useHealthCoach ? 'Health Coach Sample Queries' : 'Sample Queries'}
            </span>
            {useHealthCoach && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                {selectedCohort.replace('_', ' ')}
              </Badge>
            )}
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
              {useHealthCoach 
                ? 'Click any query to test Health Coach routing and constraints'
                : 'Click any query to test it in the chat interface'
              }
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/5 border border-white/10 p-4">
          <h3 className="font-medium text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {useHealthCoach ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-white/10"
                  onClick={() => window.open('/agent-evaluation', '_blank')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Agent Evaluation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-white/10"
                  onClick={() => window.open('/evaluation', '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Open Coding Analysis
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}