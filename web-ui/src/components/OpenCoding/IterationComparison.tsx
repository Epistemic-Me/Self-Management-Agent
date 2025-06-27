'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

// Types for comparison data
interface FailureModeComparison {
  id: string;
  label: string;
  description: string;
  beforeCount: number;
  afterCount: number;
  beforePercentage: number;
  afterPercentage: number;
  improvement: number; // positive = better (fewer failures)
  improvementPercentage: number;
}

interface DatasetFailureMode {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[];
  created_from_open_codes: string[];
}

interface IterationComparisonProps {
  beforeFailureModes: DatasetFailureMode[];
  afterFailureModes: DatasetFailureMode[];
  beforeDatasetId: string;
  afterDatasetId: string;
  beforeVersion: number;
  afterVersion: number;
  onStartNewIteration: () => void;
  onReturnToAnalysis: () => void;
}

// Same failure modes as in OpenCodingInterface
const FAILURE_MODES = [
  { id: 'incomplete_response', label: 'Incomplete Response', description: 'Response lacks sufficient detail or completeness' },
  { id: 'hallucination_issues', label: 'Hallucination Issues', description: 'Response contains fabricated or incorrect information' },
  { id: 'prompt_instruction_ignored', label: 'Prompt Instructions Ignored', description: 'Response does not follow given instructions' },
  { id: 'inappropriate_tone', label: 'Inappropriate Tone', description: 'Response tone does not match requirements' },
  { id: 'missing_context_awareness', label: 'Missing Context Awareness', description: 'Response ignores important context' },
  { id: 'factual_accuracy_errors', label: 'Factual Accuracy Errors', description: 'Response contains factual mistakes' },
  { id: 'formatting_inconsistencies', label: 'Formatting Inconsistencies', description: 'Response formatting is inconsistent or poor' },
  { id: 'bias_or_unfairness', label: 'Bias or Unfairness', description: 'Response shows bias or unfair treatment' }
];

export function IterationComparison({ 
  beforeFailureModes,
  afterFailureModes,
  beforeDatasetId,
  afterDatasetId,
  beforeVersion,
  afterVersion,
  onStartNewIteration,
  onReturnToAnalysis
}: IterationComparisonProps) {
  
  // Create a map of all failure modes that exist in either dataset
  const allFailureModes = new Map<string, { label: string; description: string }>();
  
  beforeFailureModes.forEach(fm => {
    allFailureModes.set(fm.id, { label: fm.label, description: fm.description });
  });
  afterFailureModes.forEach(fm => {
    allFailureModes.set(fm.id, { label: fm.label, description: fm.description });
  });

  // Calculate failure mode comparisons using axial coding results
  const comparisons: FailureModeComparison[] = Array.from(allFailureModes.entries()).map(([id, info]) => {
    const beforeMode = beforeFailureModes.find(fm => fm.id === id);
    const afterMode = afterFailureModes.find(fm => fm.id === id);
    
    const beforeCount = beforeMode?.count || 0;
    const afterCount = afterMode?.count || 0;
    const beforePercentage = beforeMode?.percentage || 0;
    const afterPercentage = afterMode?.percentage || 0;
    
    const improvement = beforeCount - afterCount; // positive = fewer failures = better
    const improvementPercentage = beforeCount > 0 ? ((improvement / beforeCount) * 100) : 0;

    return {
      id,
      label: info.label,
      description: info.description,
      beforeCount,
      afterCount,
      beforePercentage,
      afterPercentage,
      improvement,
      improvementPercentage
    };
  });

  // Filter to only show failure modes that occurred in either version
  const relevantComparisons = comparisons.filter(comp => 
    comp.beforeCount > 0 || comp.afterCount > 0
  );

  // Sort by improvement (best improvements first)
  const sortedComparisons = relevantComparisons.sort((a, b) => b.improvement - a.improvement);

  // Calculate overall metrics
  const totalBeforeFailures = comparisons.reduce((sum, comp) => sum + comp.beforeCount, 0);
  const totalAfterFailures = comparisons.reduce((sum, comp) => sum + comp.afterCount, 0);
  const overallImprovement = totalBeforeFailures - totalAfterFailures;
  const overallImprovementPercentage = totalBeforeFailures > 0 ? 
    ((overallImprovement / totalBeforeFailures) * 100) : 0;

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-400';
    if (improvement < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getImprovementBadge = (improvement: number, improvementPercentage: number) => {
    if (improvement > 0) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        -{improvement} (-{improvementPercentage.toFixed(0)}%)
      </Badge>;
    }
    if (improvement < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        +{Math.abs(improvement)} (+{Math.abs(improvementPercentage).toFixed(0)}%)
      </Badge>;
    }
    return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
      No change
    </Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with overall results */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Iteration Results</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              v{beforeVersion} → v{afterVersion}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Before stats */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalBeforeFailures}</div>
            <div className="text-sm text-slate-400">Failures in v{beforeVersion}</div>
            <div className="text-xs text-slate-500">
              {totalTraces > 0 ? (totalBeforeFailures / totalTraces).toFixed(1) : '0.0'} per trace
            </div>
          </div>

          {/* After stats */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalAfterFailures}</div>
            <div className="text-sm text-slate-400">Failures in v{afterVersion}</div>
            <div className="text-xs text-slate-500">
              {totalTraces > 0 ? (totalAfterFailures / totalTraces).toFixed(1) : '0.0'} per trace
            </div>
          </div>

          {/* Overall improvement */}
          <div className="text-center">
            <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${getImprovementColor(overallImprovement)}`}>
              {getImprovementIcon(overallImprovement)}
              <span>{Math.abs(overallImprovement)}</span>
            </div>
            <div className="text-sm text-slate-400">
              {overallImprovement > 0 ? 'Fewer Failures' : 
               overallImprovement < 0 ? 'More Failures' : 'No Change'}
            </div>
            {overallImprovement !== 0 && (
              <div className="text-xs text-slate-500">
                {overallImprovementPercentage > 0 ? '-' : '+'}{Math.abs(overallImprovementPercentage).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Overall assessment */}
        <div className="mt-6 p-4 rounded-lg border">
          {overallImprovement > 0 ? (
            <div className="bg-green-900/20 border-green-500/20 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Improvement Detected!</p>
                <p className="text-slate-300 text-sm">
                  Your prompt changes reduced failure modes by {overallImprovement} instances 
                  ({overallImprovementPercentage.toFixed(0)}% improvement).
                </p>
              </div>
            </div>
          ) : overallImprovement < 0 ? (
            <div className="bg-red-900/20 border-red-500/20 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">More Failures Detected</p>
                <p className="text-slate-300 text-sm">
                  The new prompt introduced {Math.abs(overallImprovement)} additional failure instances. 
                  Consider refining further.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/20 border-slate-500/20 flex items-start space-x-3">
              <Target className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">No Overall Change</p>
                <p className="text-slate-300 text-sm">
                  The total number of failures remained the same. Check individual failure modes for specific changes.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Detailed comparison by failure mode */}
      {sortedComparisons.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Detailed Comparison</h4>
          
          <div className="space-y-4">
            {sortedComparisons.map((comparison) => (
              <div key={comparison.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">{comparison.label}</span>
                    {getImprovementBadge(comparison.improvement, comparison.improvementPercentage)}
                  </div>
                </div>

                {/* Before/After visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">v{beforeVersion} (Before)</span>
                      <span className="text-slate-400">
                        {comparison.beforeCount}/{totalTraces} traces
                      </span>
                    </div>
                    <Progress value={comparison.beforePercentage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">v{afterVersion} (After)</span>
                      <span className="text-slate-400">
                        {comparison.afterCount}/{totalTraces} traces
                      </span>
                    </div>
                    <Progress value={comparison.afterPercentage} className="h-2" />
                  </div>
                </div>

                {/* Change summary */}
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>{comparison.beforeCount}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{comparison.afterCount}</span>
                  <span className={getImprovementColor(comparison.improvement)}>
                    {comparison.improvement > 0 && '↓ Improved'}
                    {comparison.improvement < 0 && '↑ Worsened'}
                    {comparison.improvement === 0 && '→ No change'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onReturnToAnalysis}
          variant="outline"
          className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
        >
          ← Return to Analysis
        </Button>

        <div className="flex items-center space-x-3">
          {overallImprovement <= 0 && (
            <Button
              onClick={onStartNewIteration}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              Try Another Iteration
            </Button>
          )}
          
          {overallImprovement > 0 && (
            <div className="flex space-x-3">
              <Button
                onClick={onStartNewIteration}
                variant="outline"
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
              >
                Iterate Further
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                Export Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}