'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle, 
  Circle, 
  Clock, 
  Users, 
  Database, 
  Brain, 
  Zap, 
  BarChart3, 
  BookOpen,
  ArrowLeft
} from 'lucide-react';

interface PhaseInfo {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  estimatedDuration: string;
  keyDeliverables: string[];
  stakeholderFocus: string[];
}

interface PhaseNavigationProps {
  currentPhase: number;
  phases: PhaseInfo[];
  onPhaseSelect?: (phaseId: number) => void;
  className?: string;
}

export function PhaseNavigation({ currentPhase, phases, onPhaseSelect, className }: PhaseNavigationProps) {
  const getPhaseIcon = (phaseId: number) => {
    const iconClass = "h-5 w-5";
    switch (phaseId) {
      case 1:
        return <Users className={iconClass} />;
      case 2:
        return <Database className={iconClass} />;
      case 3:
        return <Brain className={iconClass} />;
      case 4:
        return <Zap className={iconClass} />;
      case 5:
        return <BarChart3 className={iconClass} />;
      case 6:
        return <BookOpen className={iconClass} />;
      default:
        return <Circle className={iconClass} />;
    }
  };

  const getStatusIcon = (status: PhaseInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-400" />;
      default:
        return <Circle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusGradient = (status: PhaseInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'active':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-slate-600 to-slate-500';
    }
  };

  const getPhaseGradient = (phaseId: number) => {
    switch (phaseId) {
      case 1:
        return 'from-purple-500 to-indigo-500';
      case 2:
        return 'from-blue-500 to-cyan-500';
      case 3:
        return 'from-green-500 to-emerald-500';
      case 4:
        return 'from-yellow-500 to-orange-500';
      case 5:
        return 'from-red-500 to-pink-500';
      case 6:
        return 'from-indigo-500 to-purple-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const canNavigateToPhase = (phaseId: number, status: PhaseInfo['status']) => {
    return status === 'completed' || status === 'active' || phaseId <= currentPhase + 1;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Engagement Phases</h2>
        <Badge className="bg-gradient-to-r from-slate-600 to-slate-500 text-white border-0 px-3 py-1">
          Phase {currentPhase} of {phases.length}
        </Badge>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {phases.map((phase, index) => {
            const isClickable = canNavigateToPhase(phase.id, phase.status);
            const isActive = phase.id === currentPhase;
            
            return (
              <div key={phase.id} className="relative">
                <div
                  className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/10 border-blue-400/30 shadow-lg shadow-blue-500/20' 
                      : 'hover:bg-white/10'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  onClick={() => isClickable && onPhaseSelect?.(phase.id)}
                >
                  {/* Phase header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getPhaseGradient(phase.id)} shadow-lg`}>
                        {getPhaseIcon(phase.id)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-white font-semibold text-lg">
                            Phase {phase.id}: {phase.name}
                          </h3>
                          {getStatusIcon(phase.status)}
                        </div>
                        <p className="text-slate-400">{phase.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`bg-gradient-to-r ${getStatusGradient(phase.status)} text-white border-0 text-xs px-3 py-1`}>
                        {phase.estimatedDuration}
                      </Badge>
                    </div>
                  </div>

                  {/* Phase details (expanded for active phase) */}
                  {isActive && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <h4 className="text-white font-medium mb-3">Key Deliverables</h4>
                        <div className="space-y-2">
                          {phase.keyDeliverables.map((deliverable, idx) => (
                            <div key={idx} className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                              <span className="text-slate-300">{deliverable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium mb-3">Stakeholder Focus</h4>
                        <div className="flex flex-wrap gap-2">
                          {phase.stakeholderFocus.map((stakeholder, idx) => (
                            <Badge key={idx} className={`bg-gradient-to-r ${getPhaseGradient(phase.id)} text-white border-0 text-xs px-3 py-1`}>
                              {stakeholder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection line to next phase */}
                {index < phases.length - 1 && (
                  <div className="flex justify-center py-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-white/20 to-white/10 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation actions */}
        <div className="flex justify-between pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPhase <= 1}
            onClick={() => onPhaseSelect?.(currentPhase - 1)}
            className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous Phase
          </Button>
          
          <Button
            size="sm"
            disabled={currentPhase >= phases.length}
            onClick={() => onPhaseSelect?.(currentPhase + 1)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all duration-300 disabled:opacity-30"
          >
            Next Phase
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}