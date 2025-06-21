// Client Portal API Integration
// Integrates with existing API structure from src/lib/api.ts

import useSWR from 'swr';

// Types
export interface Phase {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  progress: number;
  estimatedDuration: string;
  keyDeliverables: string[];
  stakeholderFocus: string[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: 'SME' | 'Developer' | 'Analyst';
  status: 'active' | 'pending' | 'inactive';
  lastActivity?: string;
  permissions: string[];
}

export interface ProjectProgress {
  currentPhase: number;
  overallProgress: number;
  phases: Phase[];
  activeMilestones: any[];
}

// API Base URL - integrates with existing API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  
  return response.json();
};

// Mock data for development (replace with real API calls)
const mockProjectData = {
  currentPhase: 2,
  overallProgress: 45,
  phases: [
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
        'Trace collection system operational'
      ],
      stakeholderFocus: ['Developer', 'SME'],
      milestones: [
        {
          id: '1.1',
          name: 'Client Onboarding',
          completed: true,
          description: 'Complete client setup and stakeholder coordination'
        },
        {
          id: '1.2',
          name: 'Authentication Setup',
          completed: true,
          description: 'Implement secure authentication with role-based access'
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
        'Quality metrics dashboard'
      ],
      stakeholderFocus: ['SME', 'Analyst'],
      milestones: [
        {
          id: '2.1',
          name: 'Open Coding Application',
          completed: true,
          description: 'Build collaborative trace labeling interface'
        },
        {
          id: '2.2',
          name: 'Grading Rubric System',
          completed: false,
          description: 'Implement rubric builder and training workflow'
        }
      ]
    }
  ]
};

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

// Hooks for data fetching
export function useProjectProgress() {
  // For now, return mock data
  // Replace with: const { data, error, isLoading } = useSWR('/api/project/progress', fetcher);
  
  return {
    data: mockProjectData,
    error: null,
    isLoading: false,
    mutate: () => {}
  };
}

export function useStakeholders() {
  // For now, return mock data
  // Replace with: const { data, error, isLoading } = useSWR('/api/project/stakeholders', fetcher);
  
  return {
    data: mockStakeholders,
    error: null,
    isLoading: false,
    mutate: () => {}
  };
}

export function usePhases() {
  // For now, return mock data
  // Replace with: const { data, error, isLoading } = useSWR('/api/project/phases', fetcher);
  
  return {
    data: mockProjectData.phases,
    error: null,
    isLoading: false,
    mutate: () => {}
  };
}

// API Functions for mutations
export async function updatePhaseProgress(phaseId: number, progress: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/project/phases/${phaseId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });

    if (!response.ok) {
      throw new Error('Failed to update phase progress');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating phase progress:', error);
    throw error;
  }
}

export async function inviteStakeholder(stakeholder: Omit<Stakeholder, 'id' | 'status'>) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/project/stakeholders/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stakeholder),
    });

    if (!response.ok) {
      throw new Error('Failed to invite stakeholder');
    }

    return response.json();
  } catch (error) {
    console.error('Error inviting stakeholder:', error);
    throw error;
  }
}

export async function updateStakeholder(id: string, updates: Partial<Stakeholder>) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/project/stakeholders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update stakeholder');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating stakeholder:', error);
    throw error;
  }
}

export async function updateMilestone(milestoneId: string, updates: Partial<Milestone>) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/project/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update milestone');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
}

// Logging integration
export function logClientPortalActivity(action: string, details: any) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[Client Portal] ${action}:`, details);
    
    // Log to development logs
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      component: 'client-portal'
    };
    
    // In a real implementation, this would send to your logging service
    console.log('Logging to dev-logs:', logEntry);
  }
}