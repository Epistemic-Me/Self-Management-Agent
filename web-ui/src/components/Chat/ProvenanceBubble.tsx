'use client';

import React from 'react';
import { Brain, ChevronDown, ChevronRight, Info, Users, Target, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ProvenanceStage {
  stage: string;
  description: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

interface ProvenanceBubbleProps {
  stages: ProvenanceStage[];
  timestamp: string;
}

export function ProvenanceBubble({ stages, timestamp }: ProvenanceBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find the routing decision stage for summary
  const routingStage = stages.find(s => s.stage === 'routing_decision');
  const confidence = routingStage?.data?.confidence ? Math.round(routingStage.data.confidence * 100) : 0;
  
  // Create classification path
  const cohortStage = stages.find(s => s.stage === 'cohort_analysis');
  const cohort = cohortStage?.data?.cohort || '';
  const category = routingStage?.data?.category || '';
  const intent = routingStage?.data?.intent || '';
  
  const classificationPath = `${cohort} > ${intent}: ${category}`;
  
  // Find constraints
  const constraintStage = stages.find(s => s.stage === 'constraint_application');
  const constraints = constraintStage?.data?.constraints || [];
  
  // Get tier-based styling
  const getTierLabelClass = (nodeType: string): string => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full border';
    
    switch (nodeType.toLowerCase()) {
      case 'cohort':
        return `${baseClasses} bg-blue-500/20 text-blue-300 border-blue-500/30`;
      case 'intent':
        return `${baseClasses} bg-green-500/20 text-green-300 border-green-500/30`;
      case 'category':
        return `${baseClasses} bg-orange-500/20 text-orange-300 border-orange-500/30`;
      case 'constraint':
        return `${baseClasses} bg-purple-500/20 text-purple-300 border-purple-500/30`;
      default:
        return `${baseClasses} bg-slate-500/20 text-slate-300 border-slate-500/30`;
    }
  };
  
  // Get confidence status color
  const getConfidenceStatus = (value: number): string => {
    if (value >= 90) return 'success';
    if (value >= 80) return 'warning';
    return 'danger';
  };
  
  const getConfidenceColor = (status: string): string => {
    switch (status) {
      case 'success': return 'text-green-400 border-green-500/30';
      case 'warning': return 'text-yellow-400 border-yellow-500/30';
      case 'danger': return 'text-red-400 border-red-500/30';
      default: return 'text-slate-400 border-slate-500/30';
    }
  };
  
  // Get constraint severity color
  const getConstraintColor = (severity: string): string => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex w-full gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-purple-500/30 flex items-center justify-center">
        <Brain className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 max-w-[80%]">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-white/20 transition-all">
          {/* Header with collapse/expand */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between p-0 h-auto text-left hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Hierarchical Routing Analysis</span>
              <Badge 
                variant="outline" 
                className={`text-xs border ${getConfidenceColor(getConfidenceStatus(confidence))}`}
              >
                {confidence}% confidence
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </Button>
          
          {/* Hierarchical Processing Ledger - Always Visible */}
          <div className="mt-4 space-y-3">
            {/* Node Processing Ledger */}
            <div className="space-y-2">
              {/* Cohort Node */}
              {cohortStage && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={getTierLabelClass('cohort')}>Cohort Analysis</span>
                      <span className="text-xs text-blue-300">User Segmentation</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Function:</span> Analyzed user profile and categorized as <span className="text-blue-300 font-medium">{cohort?.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Constraints Applied:</span> User complexity level restrictions, allowed intent filtering
                    </div>
                  </div>
                </div>
              )}
              
              {/* Intent Node */}
              {routingStage && intent && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={getTierLabelClass('intent')}>Intent Classification</span>
                      <span className="text-xs text-green-300">Goal Recognition</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Function:</span> Classified user intent as <span className="text-green-300 font-medium">{intent}</span> with {confidence}% confidence
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Constraints Applied:</span> Intent-specific response scope, appropriate complexity level matching
                    </div>
                  </div>
                </div>
              )}
              
              {/* Category Node */}
              {routingStage && category && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mt-1 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={getTierLabelClass('category')}>Category Routing</span>
                      <span className="text-xs text-orange-300">Domain Focus</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Function:</span> Routed to <span className="text-orange-300 font-medium">{category}</span> domain knowledge base
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Constraints Applied:</span> Domain-specific expertise boundaries, evidence-based response requirements
                    </div>
                  </div>
                </div>
              )}
              
              {/* Constraint Application Node */}
              {constraints.length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="w-3 h-3 rounded-full bg-purple-400 mt-1 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={getTierLabelClass('constraint')}>Constraint Engine</span>
                      <span className="text-xs text-purple-300">Response Filtering</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Function:</span> Applied {constraints.length} hierarchical constraints from cohort + intent + category rules
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Active Constraints:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {constraints.map((constraint: any, index: number) => (
                          <span 
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full border ${getConstraintColor(constraint.severity)}`}
                          >
                            {constraint.type?.replace('_', ' ') || 'Constraint'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Detailed Technical Information - When Expanded */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
              {/* Processing Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Target className="h-4 w-4" />
                  <span>Processing Timeline</span>
                </div>
                
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                      <div className={`w-3 h-3 rounded-full ${
                        stage.status === 'complete' ? 'bg-green-400' :
                        stage.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                        stage.status === 'error' ? 'bg-red-400' :
                        'bg-slate-500'
                      }`}></div>
                      <span className="text-sm text-slate-300 flex-1">{stage.description}</span>
                      {stage.data?.confidence && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs border ${getConfidenceColor(getConfidenceStatus(Math.round(stage.data.confidence * 100)))}`}
                        >
                          {Math.round(stage.data.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Detailed Constraint Analysis */}
              {constraints.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <CheckCircle className="h-4 w-4" />
                    <span>Constraint Details</span>
                  </div>
                  
                  <div className="space-y-2">
                    {constraints.map((constraint: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full border font-medium ${getConstraintColor(constraint.severity)}`}>
                              {constraint.severity?.toUpperCase() || 'MEDIUM'}
                            </span>
                            <span className="text-sm text-white font-medium">
                              {constraint.type?.replace('_', ' ')?.toUpperCase() || 'CONSTRAINT'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {constraint.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs mt-2 opacity-70 text-left">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}