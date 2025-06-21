'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  description?: string;
}

interface Phase {
  id: number;
  name: string;
  progress: number;
  status: 'completed' | 'active' | 'pending';
  milestones: Milestone[];
}

interface ProgressTrackerProps {
  currentPhase: number;
  phases: Phase[];
  className?: string;
}

export function ProgressTracker({ currentPhase, phases, className }: ProgressTrackerProps) {
  const getStatusIcon = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const activePhase = phases.find(p => p.id === currentPhase);
  const overallProgress = phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Project Progress
          <Badge variant="outline" className="text-sm">
            Phase {currentPhase} of {phases.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Phase Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Engagement Phases</h4>
          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.id} className="flex items-center space-x-3">
                {getStatusIcon(phase.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      Phase {phase.id}: {phase.name}
                    </p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {phase.progress}%
                    </span>
                  </div>
                  <Progress value={phase.progress} className="h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Phase Milestones */}
        {activePhase && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Phase Milestones</h4>
            <div className="space-y-2">
              {activePhase.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                  {milestone.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${milestone.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {milestone.name}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                  {milestone.dueDate && (
                    <Badge variant="outline" className="text-xs">
                      Due {milestone.dueDate}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}