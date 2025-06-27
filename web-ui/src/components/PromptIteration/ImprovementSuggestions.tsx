'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Copy,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

// Types
interface AISuggestion {
  id: string;
  category: 'clarity' | 'specificity' | 'format' | 'context';
  suggestion: string;
  reasoning: string;
  confidence: number;
  applyable: boolean;
}

interface ImprovementSuggestionsProps {
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion) => void;
  isGenerating: boolean;
  currentPrompt: string;
}

export function ImprovementSuggestions({ 
  suggestions, 
  onApplySuggestion, 
  isGenerating,
  currentPrompt 
}: ImprovementSuggestionsProps) {
  const [previewSuggestion, setPreviewSuggestion] = useState<string | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clarity': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'specificity': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'format': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'context': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'clarity': return <Eye className="h-4 w-4" />;
      case 'specificity': return <Zap className="h-4 w-4" />;
      case 'format': return <Copy className="h-4 w-4" />;
      case 'context': return <Sparkles className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handlePreviewSuggestion = (suggestion: AISuggestion) => {
    setPreviewSuggestion(previewSuggestion === suggestion.id ? null : suggestion.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">AI Improvement Suggestions</h3>
            {suggestions.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <Button
            onClick={() => setShowPromptPreview(!showPromptPreview)}
            variant="outline"
            size="sm"
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            {showPromptPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Current Prompt
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Current Prompt
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Current Prompt Preview */}
      {showPromptPreview && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
          <h4 className="text-md font-medium text-white mb-3">Current Prompt</h4>
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-60 overflow-y-auto">
            <pre className="text-slate-200 whitespace-pre-wrap text-sm">{currentPrompt}</pre>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <div className="animate-pulse flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-slate-300">Analyzing prompt for improvement opportunities...</p>
            <p className="text-slate-400 text-sm mt-1">Our AI is reviewing your prompt structure, clarity, and effectiveness</p>
          </div>
        </Card>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <Card key={suggestion.id} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(suggestion.category)}
                    <Badge className={getCategoryColor(suggestion.category)}>
                      {suggestion.category}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-2">{suggestion.suggestion}</h4>
                    <p className="text-slate-300 text-sm mb-3">{suggestion.reasoning}</p>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-400">Confidence:</span>
                        <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      
                      {suggestion.applyable && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-green-400">Auto-applicable</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => handlePreviewSuggestion(suggestion)}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    {previewSuggestion === suggestion.id ? 'Hide Preview' : 'Preview'}
                  </Button>
                  
                  <Button
                    onClick={() => onApplySuggestion(suggestion)}
                    disabled={!suggestion.applyable}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>

              {/* Preview of applied suggestion */}
              {previewSuggestion === suggestion.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h5 className="text-sm font-medium text-white mb-2">Preview with suggestion applied:</h5>
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-slate-200 whitespace-pre-wrap text-sm">
                      {currentPrompt}
                      {'\n\n'}
                      <span className="text-green-400">[APPLIED SUGGESTION: {suggestion.suggestion}]</span>
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isGenerating && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No suggestions yet</h3>
            <p className="text-slate-400 mb-4">Click "Get AI Suggestions" to analyze your prompt for improvement opportunities</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Eye className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Clarity</p>
                <p className="text-xs text-slate-500">Clearer instructions</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Specificity</p>
                <p className="text-xs text-slate-500">More precise details</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Copy className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Format</p>
                <p className="text-xs text-slate-500">Better structure</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-xs text-slate-300 font-medium">Context</p>
                <p className="text-xs text-slate-500">Enhanced context</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/20 p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Pro Tips</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Apply suggestions one at a time to measure their individual impact</li>
              <li>• Higher confidence suggestions are more likely to improve performance</li>
              <li>• Use "Preview" to see how the suggestion would modify your prompt</li>
              <li>• Test each modification with comparison runs to validate improvements</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}