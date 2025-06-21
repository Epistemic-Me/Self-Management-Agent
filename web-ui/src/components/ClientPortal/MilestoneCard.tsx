'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Users,
  FileText,
  ExternalLink
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
  status: 'completed' | 'active' | 'pending' | 'overdue';
  progress: number;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  tasks: MilestoneTask[];
  stakeholderFocus: string[];
  resources?: { name: string; url: string }[];
}

interface MilestoneCardProps {
  milestone: Milestone;
  onUpdateTask?: (taskId: string, completed: boolean) => void;
  onViewDetails?: (milestoneId: string) => void;
  className?: string;
}

export function MilestoneCard({ 
  milestone, 
  onUpdateTask, 
  onViewDetails, 
  className 
}: MilestoneCardProps) {
  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-blue-200 bg-blue-50';
      case 'overdue':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: Milestone['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  const completedTasks = milestone.tasks.filter(task => task.completed).length;
  const isOverdue = milestone.status === 'overdue';
  const isActive = milestone.status === 'active';

  return (
    <Card className={`${className} ${getStatusColor(milestone.status)} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getStatusIcon(milestone.status)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">{milestone.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getPriorityColor(milestone.priority)}>
              {milestone.priority} priority
            </Badge>
            {milestone.dueDate && (
              <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                <span>Due {milestone.dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedTasks}/{milestone.tasks.length} tasks • {milestone.progress}%
            </span>
          </div>
          <Progress value={milestone.progress} className="h-2" />
        </div>

        {/* Tasks */}
        {milestone.tasks.length > 0 && isActive && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Tasks</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {milestone.tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md bg-background/50">
                  <button
                    onClick={() => onUpdateTask?.(task.id, !task.completed)}
                    className="flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.name}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      {task.assignee && (
                        <span className="text-xs text-muted-foreground flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{task.assignee}</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholder Focus */}
        {milestone.stakeholderFocus.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Stakeholder Focus</h4>
            <div className="flex flex-wrap gap-1">
              {milestone.stakeholderFocus.map((stakeholder, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {stakeholder}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {milestone.resources && milestone.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Resources</h4>
            <div className="space-y-1">
              {milestone.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-3 w-3" />
                  <span>{resource.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {milestone.status === 'completed' ? 'Completed' : 
             milestone.status === 'overdue' ? 'Overdue' : 
             milestone.status === 'active' ? 'In Progress' : 'Pending'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(milestone.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}