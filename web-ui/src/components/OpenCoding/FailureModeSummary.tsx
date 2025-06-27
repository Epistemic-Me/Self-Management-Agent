'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle,
  TrendingUp,
  Target,
  FileText
} from 'lucide-react';

// Types based on existing OpenCoding interface
interface AnnotationData {
  trace_id: string;
  open_code_notes: string;
  failure_modes: Record<string, boolean>;
  timestamp?: string;
}

interface FailureModeCount {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[]; // trace IDs that had this failure
}

interface FailureModeSummaryProps {
  annotations: Record<string, AnnotationData>;
  totalTraces: number;
  onStartAxialCoding: () => void;
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

export function FailureModeSummary({ annotations, totalTraces, onStartAxialCoding }: FailureModeSummaryProps) {
  // Analyze failure mode patterns from real annotations
  const failureCounts: FailureModeCount[] = FAILURE_MODES.map(mode => {
    const traces: string[] = [];
    let count = 0;

    Object.values(annotations).forEach(annotation => {
      if (annotation.failure_modes[mode.id]) {
        count++;
        traces.push(annotation.trace_id);
      }
    });

    return {
      id: mode.id,
      label: mode.label,
      description: mode.description,
      count,
      percentage: totalTraces > 0 ? (count / totalTraces) * 100 : 0,
      traces
    };
  });

  // Sort by frequency (most common first)
  const sortedFailures = failureCounts
    .filter(failure => failure.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalFailures = sortedFailures.reduce((sum, failure) => sum + failure.count, 0);
  const annotatedTraces = Object.keys(annotations).length;

  // Get severity color based on frequency
  const getSeverityColor = (percentage: number) => {
    if (percentage >= 50) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (percentage >= 30) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (percentage >= 15) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getSeverityIcon = (percentage: number) => {
    if (percentage >= 50) return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= 30) return <TrendingUp className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with summary stats */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Open Coding Analysis Complete</h3>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {annotatedTraces}/{totalTraces} traces analyzed
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalFailures}</div>
            <div className="text-sm text-slate-400">Total Failure Instances</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{sortedFailures.length}</div>
            <div className="text-sm text-slate-400">Failure Types Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {annotatedTraces > 0 ? (totalFailures / annotatedTraces).toFixed(1) : '0.0'}
            </div>
            <div className="text-sm text-slate-400">Avg Failures per Trace</div>
          </div>
        </div>
      </Card>

      {/* Failure mode breakdown */}
      {sortedFailures.length > 0 ? (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Failure Mode Patterns</h4>
          <div className="space-y-4">
            {sortedFailures.map((failure, index) => (
              <div key={failure.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {index < 3 && getSeverityIcon(failure.percentage)}
                      <span className="text-white font-medium">{failure.label}</span>
                    </div>
                    <Badge className={getSeverityColor(failure.percentage)}>
                      {failure.count}/{totalTraces} traces ({failure.percentage.toFixed(0)}%)
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Progress value={failure.percentage} className="flex-1 h-2" />
                  <span className="text-sm text-slate-400 min-w-[60px]">
                    {failure.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 ml-6">{failure.description}</p>
              </div>
            ))}
          </div>

          {/* Top issues summary */}
          {sortedFailures.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h5 className="text-white font-medium mb-1">Key Issues to Address</h5>
                  <p className="text-sm text-slate-300">
                    Your top failure modes are:{' '}
                    {sortedFailures.slice(0, 3).map((failure, index) => (
                      <span key={failure.id}>
                        <strong>{failure.label}</strong> ({failure.count} traces)
                        {index < Math.min(2, sortedFailures.length - 1) ? ', ' : ''}
                      </span>
                    ))}
                    {sortedFailures.length > 3 && ` and ${sortedFailures.length - 3} others`}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <Target className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Failure Modes Found</h3>
            <p className="text-slate-400">
              Great job! Your open coding analysis didn't identify any failure modes in the current prompt responses.
            </p>
          </div>
        </Card>
      )}

      {/* Iteration CTA */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium mb-1">Ready for Axial Coding?</h4>
            <p className="text-slate-300 text-sm">
              Group these open coding patterns into meaningful failure modes that you can use to improve your prompt.
            </p>
          </div>
          <button
            onClick={onStartAxialCoding}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Start Axial Coding
          </button>
        </div>
      </Card>
    </div>
  );
}