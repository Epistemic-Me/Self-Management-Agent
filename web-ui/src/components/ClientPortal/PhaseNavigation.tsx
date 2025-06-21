'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  BookOpen 
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
    switch (phaseId) {
      case 1:
        return <Users className="h-5 w-5" />;
      case 2:
        return <Database className="h-5 w-5" />;
      case 3:
        return <Brain className="h-5 w-5" />;
      case 4:
        return <Zap className="h-5 w-5" />;
      case 5:
        return <BarChart3 className="h-5 w-5" />;
      case 6:
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: PhaseInfo['status'], phaseId: number) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'active') {
      return <Clock className="h-4 w-4 text-blue-500" />;
    } else {
      return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PhaseInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const canNavigateToPhase = (phaseId: number, status: PhaseInfo['status']) => {
    // Can navigate to completed phases, current phase, or next pending phase
    return status === 'completed' || status === 'active' || phaseId <= currentPhase + 1;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Engagement Phases</span>
          <Badge variant="outline">
            Phase {currentPhase} of {phases.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const isClickable = canNavigateToPhase(phase.id, phase.status);
            const isActive = phase.id === currentPhase;
            
            return (
              <div
                key={phase.id}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive 
                    ? 'border-primary bg-primary/5' 
                    : getStatusColor(phase.status)
                } ${isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'}`}
                onClick={() => isClickable && onPhaseSelect?.(phase.id)}
              >
                {/* Phase header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {getPhaseIcon(phase.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">Phase {phase.id}: {phase.name}</h3>
                        {getStatusIcon(phase.status, phase.id)}
                      </div>
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {phase.estimatedDuration}
                    </Badge>
                  </div>
                </div>

                {/* Phase details (expanded for active phase) */}
                {isActive && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Deliverables</h4>
                      <ul className="space-y-1">
                        {phase.keyDeliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                            <Circle className="h-3 w-3 flex-shrink-0" />
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Stakeholder Focus</h4>
                      <div className="flex flex-wrap gap-1">
                        {phase.stakeholderFocus.map((stakeholder, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection line to next phase */}
                {index < phases.length - 1 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-4 bg-border"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPhase <= 1}
            onClick={() => onPhaseSelect?.(currentPhase - 1)}
          >
            Previous Phase
          </Button>
          
          <Button
            size="sm"
            disabled={currentPhase >= phases.length}
            onClick={() => onPhaseSelect?.(currentPhase + 1)}
          >
            Next Phase
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}