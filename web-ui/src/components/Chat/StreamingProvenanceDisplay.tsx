'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Target,
  Settings,
  Zap
} from 'lucide-react';

interface StreamingProvenanceStage {
  stage: string;
  description: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

interface StreamingProvenanceDisplayProps {
  stages: StreamingProvenanceStage[];
  compact?: boolean;
}

const stageConfig = {
  cohort_analysis: {
    icon: Target,
    label: 'Cohort Analysis',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  intent_classification: {
    icon: Brain,
    label: 'Intent Classification', 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  routing_decision: {
    icon: ChevronRight,
    label: 'Routing Decision',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  constraint_application: {
    icon: Settings,
    label: 'Constraint Application',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  },
  response_generation: {
    icon: Zap,
    label: 'Response Generation',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  response_ready: {
    icon: CheckCircle,
    label: 'Response Ready',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
};

export function StreamingProvenanceDisplay({ 
  stages, 
  compact = false 
}: StreamingProvenanceDisplayProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'processing':
        return <Clock className="h-3 w-3 text-yellow-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 text-slate-500" />;
    }
  };

  const formatConstraints = (constraints: any[]) => {
    if (!constraints || constraints.length === 0) return 'None';
    return constraints.map(c => c.description || c.type).join(', ');
  };

  if (compact) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-3">
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const config = stageConfig[stage.stage as keyof typeof stageConfig];
            const Icon = config?.icon || Clock;
            
            return (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Icon className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-300">{config?.label || stage.stage}</span>
                </div>
                {getStatusIcon(stage.status)}
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4 space-y-3">
      <div className="flex items-center space-x-2 mb-3">
        <Brain className="h-4 w-4 text-cyan-400" />
        <span className="font-medium text-white">Processing Pipeline</span>
        <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
          Live
        </Badge>
      </div>
      
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const config = stageConfig[stage.stage as keyof typeof stageConfig];
          const Icon = config?.icon || Clock;
          const isLast = index === stages.length - 1;
          
          return (
            <div key={index} className="relative">
              {/* Stage indicator */}
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border ${config?.color || 'bg-slate-700 border-slate-600'} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {config?.label || stage.stage}
                    </h4>
                    {getStatusIcon(stage.status)}
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-1">
                    {stage.description}
                  </p>
                  
                  {/* Stage-specific data */}
                  {stage.data && (
                    <div className="mt-2 text-xs">
                      {stage.stage === 'cohort_analysis' && stage.data.cohort && (
                        <Badge variant="secondary" className="text-xs">
                          {stage.data.cohort.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      
                      {stage.stage === 'routing_decision' && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                            {stage.data.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                            {stage.data.intent}
                          </Badge>
                          {stage.data.confidence && (
                            <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                              {Math.round(stage.data.confidence * 100)}% confident
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {stage.stage === 'constraint_application' && stage.data.constraints && (
                        <div className="text-slate-300">
                          <div className="font-medium mb-1">Applied Constraints:</div>
                          {stage.data.constraints.map((constraint: any, i: number) => (
                            <div key={i} className="ml-2 text-slate-400">
                              • {constraint.description} ({constraint.severity} severity)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Connection line */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-600"></div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}