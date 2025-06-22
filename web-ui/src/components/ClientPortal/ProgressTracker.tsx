'use client';

import React from 'react';
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
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-400" />;
      default:
        return <Circle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'active':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-slate-600 to-slate-500';
    }
  };

  const activePhase = phases.find(p => p.id === currentPhase);
  const overallProgress = phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Project Progress</h2>
        <Badge className="bg-gradient-to-r from-slate-600 to-slate-500 text-white border-0 px-3 py-1">
          Phase {currentPhase} of {phases.length}
        </Badge>
      </div>
      <div className="space-y-8">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-white">Overall Completion</span>
            <span className="text-2xl font-bold text-white">{Math.round(overallProgress)}%</span>
          </div>
          <div className="relative h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Phase Progress */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-white">Engagement Phases</h3>
          <div className="space-y-4">
            {phases.map((phase) => (
              <div key={phase.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(phase.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium truncate">
                        Phase {phase.id}: {phase.name}
                      </span>
                      <span className="text-slate-300 font-semibold">
                        {phase.progress}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getStatusColor(phase.status)} transition-all duration-1000 ease-out rounded-full`}
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Phase Milestones */}
        {activePhase && activePhase.milestones.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Current Phase Milestones</h3>
            <div className="space-y-3">
              {activePhase.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
                  <div className="flex-shrink-0">
                    {milestone.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-white ${milestone.completed ? 'line-through opacity-60' : ''}`}>
                      {milestone.name}
                    </span>
                    {milestone.description && (
                      <p className="text-slate-400 text-sm mt-1">{milestone.description}</p>
                    )}
                  </div>
                  {milestone.dueDate && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                      Due {milestone.dueDate}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}