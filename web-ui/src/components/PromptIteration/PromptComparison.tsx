'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  CheckCircle
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

interface PromptComparisonProps {
  promptVersions: PromptVersion[];
  currentComparison: [PromptVersion, PromptVersion] | null;
  onComparisonChange: (comparison: [PromptVersion, PromptVersion]) => void;
  comparisonTraces: ComparisonTrace[];
  isRunning: boolean;
}

export function PromptComparison({ 
  promptVersions, 
  currentComparison, 
  onComparisonChange, 
  comparisonTraces,
  isRunning 
}: PromptComparisonProps) {
  const [selectedTraceIndex, setSelectedTraceIndex] = useState(0);
  const [showFullPrompts, setShowFullPrompts] = useState(false);

  if (!currentComparison) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
        <div className="text-center">
          <p className="text-slate-400">No prompt versions available for comparison</p>
        </div>
      </Card>
    );
  }

  const [leftVersion, rightVersion] = currentComparison;
  const currentTrace = comparisonTraces[selectedTraceIndex];

  // Calculate performance differences
  const getMetricDifference = (leftValue: number, rightValue: number) => {
    const diff = rightValue - leftValue;
    const percentDiff = leftValue > 0 ? (diff / leftValue) * 100 : 0;
    return { diff, percentDiff };
  };

  const qualityDiff = leftVersion.metrics && rightVersion.metrics ? 
    getMetricDifference(leftVersion.metrics.qualityScore, rightVersion.metrics.qualityScore) : null;
  
  const timeDiff = leftVersion.metrics && rightVersion.metrics ?
    getMetricDifference(leftVersion.metrics.responseTime, rightVersion.metrics.responseTime) : null;

  const successDiff = leftVersion.metrics && rightVersion.metrics ?
    getMetricDifference(leftVersion.metrics.successRate, rightVersion.metrics.successRate) : null;

  return (
    <div className="space-y-6">
      {/* Version Selector */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm text-slate-300 block mb-1">Version A</label>
              <select 
                value={leftVersion.id}
                onChange={(e) => {
                  const selected = promptVersions.find(v => v.id === e.target.value);
                  if (selected) onComparisonChange([selected, rightVersion]);
                }}
                className="bg-slate-800 border border-slate-600 text-white rounded px-3 py-1 text-sm"
              >
                {promptVersions.map(version => (
                  <option key={version.id} value={version.id}>
                    v{version.version} ({new Date(version.timestamp).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-slate-400">vs</div>
            
            <div>
              <label className="text-sm text-slate-300 block mb-1">Version B</label>
              <select 
                value={rightVersion.id}
                onChange={(e) => {
                  const selected = promptVersions.find(v => v.id === e.target.value);
                  if (selected) onComparisonChange([leftVersion, selected]);
                }}
                className="bg-slate-800 border border-slate-600 text-white rounded px-3 py-1 text-sm"
              >
                {promptVersions.map(version => (
                  <option key={version.id} value={version.id}>
                    v{version.version} ({new Date(version.timestamp).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => setShowFullPrompts(!showFullPrompts)}
            variant="outline"
            size="sm"
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            {showFullPrompts ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Full Prompts
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Full Prompts
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-300">Quality Score</span>
            </div>
            {qualityDiff && (
              <div className="flex items-center space-x-1">
                {qualityDiff.diff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : qualityDiff.diff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-400" />
                )}
                <span className={`text-sm ${qualityDiff.diff > 0 ? 'text-green-400' : qualityDiff.diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {qualityDiff.diff > 0 ? '+' : ''}{qualityDiff.diff.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-lg font-bold text-white">{leftVersion.metrics?.qualityScore || 0}%</span>
            <span className="text-lg font-bold text-white">{rightVersion.metrics?.qualityScore || 0}%</span>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-slate-300">Response Time</span>
            </div>
            {timeDiff && (
              <div className="flex items-center space-x-1">
                {timeDiff.diff < 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : timeDiff.diff > 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-400" />
                )}
                <span className={`text-sm ${timeDiff.diff < 0 ? 'text-green-400' : timeDiff.diff > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {timeDiff.diff > 0 ? '+' : ''}{Math.round(timeDiff.diff)}ms
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-lg font-bold text-white">{leftVersion.metrics?.responseTime || 0}ms</span>
            <span className="text-lg font-bold text-white">{rightVersion.metrics?.responseTime || 0}ms</span>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Success Rate</span>
            </div>
            {successDiff && (
              <div className="flex items-center space-x-1">
                {successDiff.diff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : successDiff.diff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-400" />
                )}
                <span className={`text-sm ${successDiff.diff > 0 ? 'text-green-400' : successDiff.diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {successDiff.diff > 0 ? '+' : ''}{successDiff.diff.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-lg font-bold text-white">{leftVersion.metrics?.successRate || 0}%</span>
            <span className="text-lg font-bold text-white">{rightVersion.metrics?.successRate || 0}%</span>
          </div>
        </Card>
      </div>

      {/* Full Prompts Comparison (if expanded) */}
      {showFullPrompts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Version A (v{leftVersion.version})</h3>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {new Date(leftVersion.timestamp).toLocaleDateString()}
              </Badge>
            </div>
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-80 overflow-y-auto">
              <pre className="text-slate-200 whitespace-pre-wrap text-sm">{leftVersion.content}</pre>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Version B (v{rightVersion.version})</h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {new Date(rightVersion.timestamp).toLocaleDateString()}
              </Badge>
            </div>
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-80 overflow-y-auto">
              <pre className="text-slate-200 whitespace-pre-wrap text-sm">{rightVersion.content}</pre>
            </div>
          </Card>
        </div>
      )}

      {/* Response Comparison */}
      {comparisonTraces.length > 0 && !isRunning && (
        <div className="space-y-4">
          {/* Trace Selector */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Response Comparison</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-300">Query:</span>
                <select 
                  value={selectedTraceIndex}
                  onChange={(e) => setSelectedTraceIndex(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white rounded px-3 py-1 text-sm"
                >
                  {comparisonTraces.map((trace, index) => (
                    <option key={trace.id} value={index}>
                      {index + 1}: {trace.query.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Current Query */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h4 className="text-md font-medium text-white mb-2">Query</h4>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-slate-200">{currentTrace?.query}</p>
            </div>
          </Card>

          {/* Side-by-side Response Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-white">Response A (v{leftVersion.version})</h4>
                <div className="flex space-x-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Quality: {currentTrace?.leftMetrics.qualityScore.toFixed(1)}%
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {Math.round(currentTrace?.leftMetrics.responseTime || 0)}ms
                  </Badge>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-80 overflow-y-auto">
                <p className="text-slate-200 whitespace-pre-wrap">{currentTrace?.leftResponse}</p>
              </div>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-white">Response B (v{rightVersion.version})</h4>
                <div className="flex space-x-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Quality: {currentTrace?.rightMetrics.qualityScore.toFixed(1)}%
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {Math.round(currentTrace?.rightMetrics.responseTime || 0)}ms
                  </Badge>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-80 overflow-y-auto">
                <p className="text-slate-200 whitespace-pre-wrap">{currentTrace?.rightResponse}</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isRunning && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Running comparison tests...</p>
            <p className="text-slate-400 text-sm mt-1">This may take a few moments</p>
          </div>
        </Card>
      )}

      {/* No Results State */}
      {comparisonTraces.length === 0 && !isRunning && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <p className="text-slate-400">No comparison results yet</p>
            <p className="text-slate-500 text-sm mt-1">Click "Run Comparison" to test both prompt versions</p>
          </div>
        </Card>
      )}
    </div>
  );
}