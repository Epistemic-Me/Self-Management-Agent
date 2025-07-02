'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronRight, 
  TreePine, 
  Target, 
  Shield, 
  Brain,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import type { Provenance } from '@/types/health-coach';

interface ProvenanceDisplayProps {
  provenance: Provenance;
  compact?: boolean;
}

export function ProvenanceDisplay({ provenance, compact = false }: ProvenanceDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create hierarchy path string
  const hierarchyPath = [
    `Cohort: ${provenance.cohort.replace('_', ' ')}`,
    `Intent: ${provenance.intent_class.replace('_', ' ')}`,
    `Category: ${provenance.category}`,
    provenance.sub_intent ? `Sub-intent: ${provenance.sub_intent}` : null
  ].filter(Boolean).join(' > ');

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get constraint severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <TreePine className="h-3 w-3" />
        <span>{provenance.category}</span>
        <span>•</span>
        <span>{provenance.intent_class.replace('_', ' ')}</span>
        <Badge 
          variant="outline" 
          className={`${getConfidenceColor(provenance.confidence)} border-current`}
        >
          {Math.round(provenance.confidence * 100)}%
        </Badge>
      </div>
    );
  }

  return (
    <Card className="mt-2 bg-slate-800/50 border-slate-700">
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-slate-300 hover:text-white hover:bg-slate-700/50"
        >
          <div className="flex items-center space-x-2">
            <TreePine className="h-4 w-4" />
            <span className="text-sm font-medium">Reasoning Provenance</span>
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(provenance.confidence)} border-current`}
            >
              {Math.round(provenance.confidence * 100)}% confidence
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {isExpanded && (
          <div className="mt-3 space-y-3 text-sm">
            {/* Hierarchy Path */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-slate-200">Classification Path</span>
              </div>
              <div className="pl-6 text-slate-300 font-mono text-xs">
                {hierarchyPath}
              </div>
            </div>

            {/* Applied Constraints */}
            {provenance.constraints_applied.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-slate-200">Applied Constraints</span>
                </div>
                <div className="pl-6 space-y-1">
                  {provenance.constraints_applied.map((constraint, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`mt-1 ${getSeverityColor(constraint.severity)}`}>
                        {constraint.severity === 'high' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-300">{constraint.description}</div>
                        <div className="text-xs text-slate-500">
                          Type: {constraint.type} • Severity: {constraint.severity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-slate-200">Reasoning</span>
              </div>
              <div className="pl-6 text-slate-300 text-xs">
                {provenance.reasoning}
              </div>
            </div>

            {/* Trace ID */}
            <div className="pt-2 border-t border-slate-700">
              <div className="text-xs text-slate-500">
                Trace ID: <span className="font-mono">{provenance.trace_id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}