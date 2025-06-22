'use client';

import React, { useState } from 'react';
import { ProgressTracker } from '@/components/ClientPortal/ProgressTracker';
import { StakeholderView } from '@/components/ClientPortal/StakeholderView';
import { PhaseNavigation } from '@/components/ClientPortal/PhaseNavigation';
import { MilestoneCard } from '@/components/ClientPortal/MilestoneCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  Users, 
  BarChart3, 
  Settings,
  Bell,
  Calendar,
  Loader2
} from 'lucide-react';
import { 
  useProjectProgress, 
  useStakeholders, 
  usePhases,
  updateStakeholder,
  inviteStakeholder,
  logClientPortalActivity
} from '@/lib/api/client-portal';

// Mock data for demonstration - All 6 phases
const mockPhases = [
  {
    id: 1,
    name: 'Foundation & Audit Infrastructure',
    description: 'Client onboarding, trace collection, and project management infrastructure',
    status: 'completed' as const,
    progress: 100,
    estimatedDuration: '4-6 weeks',
    keyDeliverables: [
      'Client onboarding completed',
      'Authentication system implemented',
      'Trace collection system operational',
      'Project management dashboard deployed'
    ],
    stakeholderFocus: ['Developer', 'SME'],
    milestones: [
      {
        id: '1.1',
        name: 'Client Onboarding',
        completed: true,
        description: 'Complete client setup and stakeholder coordination',
        dueDate: '2024-01-15'
      },
      {
        id: '1.2',
        name: 'Authentication Setup',
        completed: true,
        description: 'Implement secure authentication with role-based access',
        dueDate: '2024-01-22'
      }
    ]
  },
  {
    id: 2,
    name: 'Open Coding & Analysis Platform',
    description: 'Collaborative trace labeling and analysis interface development',
    status: 'active' as const,
    progress: 65,
    estimatedDuration: '3-4 weeks',
    keyDeliverables: [
      'Open coding interface implementation',
      'Collaborative labeling system',
      'Quality metrics dashboard',
      'SME training workflow integration'
    ],
    stakeholderFocus: ['SME', 'Analyst'],
    milestones: [
      {
        id: '2.1',
        name: 'Open Coding Application',
        completed: true,
        description: 'Build collaborative trace labeling interface',
        dueDate: '2024-02-05'
      },
      {
        id: '2.2',
        name: 'Grading Rubric System',
        completed: false,
        description: 'Implement rubric builder and training workflow',
        dueDate: '2024-02-15'
      }
    ]
  },
  {
    id: 3,
    name: 'Failure Mode Analysis & Taxonomy',
    description: 'Systematic failure analysis and taxonomy building',
    status: 'pending' as const,
    progress: 0,
    estimatedDuration: '4-5 weeks',
    keyDeliverables: [
      'Failure analysis workbench',
      'Taxonomy builder interface',
      'Golden traces management',
      'Automated failure detection system'
    ],
    stakeholderFocus: ['SME', 'Analyst'],
    milestones: [
      {
        id: '3.1',
        name: 'Failure Analysis Framework',
        completed: false,
        description: 'Develop systematic failure categorization system',
        dueDate: '2024-03-01'
      },
      {
        id: '3.2',
        name: 'Taxonomy Builder',
        completed: false,
        description: 'Build interactive taxonomy creation interface',
        dueDate: '2024-03-15'
      }
    ]
  },
  {
    id: 4,
    name: 'Advanced Analytics & Insights Engine',
    description: 'AI-powered analytics for pattern recognition and predictive insights',
    status: 'pending' as const,
    progress: 0,
    estimatedDuration: '5-6 weeks',
    keyDeliverables: [
      'Machine learning pipeline deployment',
      'Pattern recognition algorithms',
      'Predictive analytics dashboard',
      'Automated insight generation',
      'Performance optimization system'
    ],
    stakeholderFocus: ['Analyst', 'Developer'],
    milestones: [
      {
        id: '4.1',
        name: 'ML Pipeline Setup',
        completed: false,
        description: 'Establish machine learning infrastructure',
        dueDate: '2024-04-01'
      },
      {
        id: '4.2',
        name: 'Analytics Dashboard',
        completed: false,
        description: 'Build comprehensive analytics visualization',
        dueDate: '2024-04-20'
      }
    ]
  },
  {
    id: 5,
    name: 'Optimization & Performance Tuning',
    description: 'System optimization, performance monitoring, and scalability improvements',
    status: 'pending' as const,
    progress: 0,
    estimatedDuration: '3-4 weeks',
    keyDeliverables: [
      'Performance monitoring dashboard',
      'Automated optimization systems',
      'Scalability architecture implementation',
      'Load testing and capacity planning',
      'Security hardening and compliance'
    ],
    stakeholderFocus: ['Developer', 'SME'],
    milestones: [
      {
        id: '5.1',
        name: 'Performance Monitoring',
        completed: false,
        description: 'Implement comprehensive system monitoring',
        dueDate: '2024-05-01'
      },
      {
        id: '5.2',
        name: 'Scalability Implementation',
        completed: false,
        description: 'Deploy auto-scaling and load balancing',
        dueDate: '2024-05-15'
      }
    ]
  },
  {
    id: 6,
    name: 'Deployment & Knowledge Transfer',
    description: 'Production deployment, documentation, and comprehensive knowledge transfer',
    status: 'pending' as const,
    progress: 0,
    estimatedDuration: '2-3 weeks',
    keyDeliverables: [
      'Production environment deployment',
      'Comprehensive documentation suite',
      'User training materials and sessions',
      'Maintenance and support procedures',
      'Final system validation and sign-off'
    ],
    stakeholderFocus: ['Developer', 'SME', 'Analyst'],
    milestones: [
      {
        id: '6.1',
        name: 'Production Deployment',
        completed: false,
        description: 'Deploy system to production environment',
        dueDate: '2024-06-01'
      },
      {
        id: '6.2',
        name: 'Knowledge Transfer',
        completed: false,
        description: 'Complete documentation and training',
        dueDate: '2024-06-10'
      }
    ]
  }
];

const mockStakeholders = [
  {
    id: 'sme-1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@client.com',
    role: 'SME' as const,
    status: 'active' as const,
    lastActivity: '2 hours ago',
    permissions: ['evaluate-traces', 'create-rubrics', 'validate-taxonomy']
  },
  {
    id: 'dev-1',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@client.com',
    role: 'Developer' as const,
    status: 'active' as const,
    lastActivity: '30 minutes ago',
    permissions: ['manage-project', 'configure-system', 'deploy-changes']
  },
  {
    id: 'analyst-1',
    name: 'Emma Thompson',
    email: 'emma.thompson@client.com',
    role: 'Analyst' as const,
    status: 'pending' as const,
    permissions: ['analyze-data', 'generate-reports', 'view-metrics']
  }
];

const mockMilestones = [
  {
    id: 'ms-2.1',
    name: 'Open Coding Interface Development',
    description: 'Build collaborative trace labeling and analysis interface',
    status: 'active' as const,
    progress: 75,
    dueDate: 'Feb 15',
    priority: 'high' as const,
    tasks: [
      { id: 't1', name: 'Design component architecture', completed: true, assignee: 'Mike' },
      { id: 't2', name: 'Implement labeling interface', completed: true, assignee: 'Mike' },
      { id: 't3', name: 'Add collaboration features', completed: false, assignee: 'Mike', dueDate: 'Feb 10' },
      { id: 't4', name: 'Testing and validation', completed: false, assignee: 'Emma', dueDate: 'Feb 13' }
    ],
    stakeholderFocus: ['Developer', 'SME'],
    resources: [
      { name: 'Design Specifications', url: '#' },
      { name: 'Technical Requirements', url: '#' }
    ]
  },
  {
    id: 'ms-2.2',
    name: 'Grading Rubric & Training System',
    description: 'Implement rubric builder with SME training workflow',
    status: 'pending' as const,
    progress: 25,
    dueDate: 'Feb 22',
    priority: 'medium' as const,
    tasks: [
      { id: 't5', name: 'Rubric builder interface', completed: false, assignee: 'Mike' },
      { id: 't6', name: 'Training workflow system', completed: false, assignee: 'Sarah' },
      { id: 't7', name: 'Quality metrics integration', completed: false, assignee: 'Emma' }
    ],
    stakeholderFocus: ['SME', 'Analyst']
  }
];

export default function ClientPortalPage() {
  const [currentUserRole] = useState<'SME' | 'Developer' | 'Analyst'>('Developer');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentPhaseOverride, setCurrentPhaseOverride] = useState<number | null>(null);

  // Use API hooks
  const { data: projectData, isLoading: projectLoading, mutate: mutateProject } = useProjectProgress();
  const { data: stakeholders, isLoading: stakeholdersLoading, mutate: mutateStakeholders } = useStakeholders();
  const { data: phases, isLoading: phasesLoading } = usePhases();

  const currentPhase = currentPhaseOverride || projectData?.currentPhase || 2;

  const handlePhaseSelect = (phaseId: number) => {
    logClientPortalActivity('phase_selected', { phaseId, previousPhase: currentPhase });
    // Update the current phase locally for demo purposes
    setCurrentPhaseOverride(phaseId);
    console.log('Phase selected:', phaseId);
  };

  const handleInviteStakeholder = async () => {
    try {
      logClientPortalActivity('stakeholder_invite_initiated', { userRole: currentUserRole });
      // TODO: Implement stakeholder invitation modal
      console.log('Invite stakeholder clicked');
    } catch (error) {
      console.error('Error inviting stakeholder:', error);
    }
  };

  const handleUpdateStakeholder = async (id: string, updates: any) => {
    try {
      logClientPortalActivity('stakeholder_updated', { stakeholderId: id, updates });
      await updateStakeholder(id, updates);
      mutateStakeholders(); // Refresh stakeholders data
    } catch (error) {
      console.error('Error updating stakeholder:', error);
    }
  };

  const handleUpdateTask = (taskId: string, completed: boolean) => {
    // TODO: Implement task update logic
    console.log('Update task:', taskId, completed);
  };

  const handleViewMilestoneDetails = (milestoneId: string) => {
    // TODO: Implement milestone details modal
    console.log('View milestone details:', milestoneId);
  };

  const activeMilestones = mockMilestones.filter(m => m.status === 'active');

  // Loading state
  if (projectLoading || stakeholdersLoading || phasesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading client portal...</span>
        </div>
      </div>
    );
  }

  // Use data from API or fallback to mock data
  const displayPhases = phases || mockPhases;
  const displayStakeholders = stakeholders || mockStakeholders;

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page header integrated with content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Client Portal</h1>
          <p className="text-slate-400">
            Track progress and coordinate with stakeholders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2" data-testid="phase-badge">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Phase {currentPhase} Active</span>
          </Badge>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg border-2 border-cyan-400/50">
            <span className="text-white font-bold text-sm">DV</span>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 grid w-full grid-cols-4">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Rocket className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="flex items-center space-x-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stakeholders" 
              className="flex items-center space-x-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Users className="h-4 w-4" />
              <span>Stakeholders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="phases" 
              className="flex items-center space-x-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Calendar className="h-4 w-4" />
              <span>Phases</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Progress Overview */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <ProgressTracker
                    currentPhase={currentPhase}
                    phases={displayPhases}
                  />
                </div>
                
                {/* Active Milestones */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Active Milestones</h3>
                  <div className="space-y-4">
                    {activeMilestones.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">
                        No active milestones
                      </p>
                    ) : (
                      activeMilestones.map((milestone) => (
                        <MilestoneCard
                          key={milestone.id}
                          milestone={milestone}
                          onUpdateTask={handleUpdateTask}
                          onViewDetails={handleViewMilestoneDetails}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Stakeholder Summary */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <StakeholderView
                    stakeholders={displayStakeholders}
                    currentUserRole={currentUserRole}
                    onInviteStakeholder={handleInviteStakeholder}
                    onUpdateStakeholder={handleUpdateStakeholder}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <ProgressTracker
                currentPhase={currentPhase}
                phases={displayPhases}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <StakeholderView
                stakeholders={displayStakeholders}
                currentUserRole={currentUserRole}
                onInviteStakeholder={handleInviteStakeholder}
                onUpdateStakeholder={handleUpdateStakeholder}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <PhaseNavigation
                currentPhase={currentPhase}
                phases={displayPhases}
                onPhaseSelect={handlePhaseSelect}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}