'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Users, 
  Target, 
  Edit3,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { getProjectSummary, getProjectState } from '@/lib/project-state';

interface ProjectOverviewProps {
  className?: string;
}

export function ProjectOverview({ className = "" }: ProjectOverviewProps) {
  const router = useRouter();
  const projectSummary = getProjectSummary();
  const projectState = getProjectState();

  if (!projectSummary || !projectState.projectData) {
    return null;
  }

  const handleEditProject = () => {
    router.push('/project-setup');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const { projectData } = projectState;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Project Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-2xl font-bold text-white">
                {projectSummary.name}
              </h1>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Setup Complete
              </Badge>
            </div>
            {projectSummary.description && (
              <p className="text-slate-300 mb-4">
                {projectSummary.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Started: {formatDate(projectSummary.startDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Duration: {projectSummary.duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{projectSummary.teamSize} team member{projectSummary.teamSize !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>{projectSummary.objectives} objective{projectSummary.objectives !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleEditProject}
            variant="outline"
            size="sm"
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        </div>
      </Card>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Team</h3>
          </div>
          <div className="space-y-3">
            {/* Project Manager */}
            {projectData.stakeholders?.projectManager && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-white">
                    {projectData.stakeholders.projectManager.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {projectData.stakeholders.projectManager.email}
                  </p>
                </div>
                <Badge variant="secondary">Manager</Badge>
              </div>
            )}
            
            {/* Team Members */}
            {projectData.stakeholders?.teamMembers?.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="text-sm text-slate-400">{member.email}</p>
                </div>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Objectives */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Objectives</h3>
          </div>
          <div className="space-y-2">
            {projectData.requirements?.objectives?.map((objective, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{objective}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Configuration */}
        {projectData.promptConfiguration?.systemPrompt && (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Configuration</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">System Prompt</p>
                <p className="text-xs text-slate-400 bg-white/5 p-2 rounded border max-h-20 overflow-y-auto">
                  {projectData.promptConfiguration.systemPrompt.substring(0, 200)}
                  {projectData.promptConfiguration.systemPrompt.length > 200 ? '...' : ''}
                </p>
              </div>
              {projectData.promptConfiguration.description && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1">Description</p>
                  <p className="text-xs text-slate-400">
                    {projectData.promptConfiguration.description}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Integration Settings */}
        {projectData.integration && (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ArrowRight className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Integration</h3>
            </div>
            <div className="space-y-3">
              {projectData.integration.githubRepo && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1">GitHub Repository</p>
                  <p className="text-xs text-slate-400">{projectData.integration.githubRepo}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Notifications</p>
                <div className="flex space-x-2">
                  {projectData.integration.notifications?.email && (
                    <Badge variant="secondary">Email</Badge>
                  )}
                  {projectData.integration.notifications?.slack && (
                    <Badge variant="secondary">Slack</Badge>
                  )}
                  {projectData.integration.notifications?.teams && (
                    <Badge variant="secondary">Teams</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}