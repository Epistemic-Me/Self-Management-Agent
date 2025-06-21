'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Users,
  FileText,
  ExternalLink,
  Target
} from 'lucide-react';

interface MilestoneTask {
  id: string;
  name: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'pending' | 'completed';
  progress: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  tasks: MilestoneTask[];
  stakeholderFocus: string[];
  resources?: { name: string; url: string }[];
}

interface MilestoneCardProps {
  milestone: Milestone;
  onUpdateTask: (taskId: string, completed: boolean) => void;
  onViewDetails: (milestoneId: string) => void;
}

export function MilestoneCard({ milestone, onUpdateTask, onViewDetails }: MilestoneCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-orange-500';
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 'low':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-400" />;
      default:
        return <Circle className="h-5 w-5 text-slate-400" />;
    }
  };

  const completedTasks = milestone.tasks.filter(task => task.completed).length;
  const totalTasks = milestone.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Target className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{milestone.name}</h3>
            <p className="text-slate-400 text-sm">{milestone.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`bg-gradient-to-r ${getPriorityColor(milestone.priority)} text-white border-0 text-xs px-2 py-1`}>
            {milestone.priority.toUpperCase()} Priority
          </Badge>
          {getStatusIcon(milestone.status)}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">Progress: {completedTasks}/{totalTasks} tasks</span>
          <span className="text-slate-300 font-semibold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <div className="flex items-center space-x-1 text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Due {milestone.dueDate}</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <Users className="h-4 w-4" />
            <span>{milestone.stakeholderFocus.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3 mb-6">
        {milestone.tasks.map((task) => (
          <div key={task.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onUpdateTask(task.id, !task.completed)}
                className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
              >
                {task.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400 hover:text-blue-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                  {task.name}
                </span>
                <div className="flex items-center space-x-4 mt-1">
                  {task.assignee && (
                    <span className="text-slate-400 text-xs">
                      Assigned to {task.assignee}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-slate-400 text-xs">
                      Due {task.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resources & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {milestone.resources && milestone.resources.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Resources ({milestone.resources.length})
            </Button>
          )}
        </div>
        <Button
          onClick={() => onViewDetails(milestone.id)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all duration-300"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}