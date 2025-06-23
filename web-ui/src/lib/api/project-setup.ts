// Project Setup API Integration
// Handles project creation, draft saving, and wizard state management

import { ProjectFormData } from '@/components/ProjectSetup/ProjectSetupWizard';

// API Base URL - integrates with existing API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

// Types for API responses
export interface ProjectDraft {
  id: string;
  userId: string;
  data: Partial<ProjectFormData>;
  lastSaved: string;
  stepCompleted: number;
}

export interface CreatedProject {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  phases: any[];
  stakeholders: any[];
}

// API Functions

/**
 * Save project draft - called during auto-save and manual save
 */
export async function saveProjectDraft(draftId: string | null, data: Partial<ProjectFormData>): Promise<ProjectDraft> {
  try {
    const url = draftId 
      ? `${API_BASE_URL}/api/projects/drafts/${draftId}`
      : `${API_BASE_URL}/api/projects/drafts`;
    
    const method = draftId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        lastSaved: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save project draft: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error saving project draft:', error);
    throw error;
  }
}

/**
 * Load existing project draft
 */
export async function loadProjectDraft(draftId: string): Promise<ProjectDraft> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/drafts/${draftId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load project draft: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error loading project draft:', error);
    throw error;
  }
}

/**
 * Create final project from completed wizard data
 */
export async function createProject(data: ProjectFormData): Promise<CreatedProject> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Failed to create project: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Delete project draft
 */
export async function deleteProjectDraft(draftId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete project draft: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting project draft:', error);
    throw error;
  }
}

/**
 * Validate GitHub repository URL
 */
export async function validateGithubRepo(repoUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/github/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repoUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate GitHub repository');
    }

    return response.json();
  } catch (error) {
    console.error('Error validating GitHub repo:', error);
    return { valid: false, error: 'Unable to validate repository' };
  }
}

/**
 * Get list of user's project drafts
 */
export async function getUserProjectDrafts(): Promise<ProjectDraft[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/drafts`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project drafts');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching project drafts:', error);
    return [];
  }
}

// Form validation helpers
export function validateProjectFormStep(step: number, data: Partial<ProjectFormData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (step) {
    case 1: // Project Information
      if (!data.projectInfo?.name?.trim()) {
        errors.push('Project name is required');
      }
      if (!data.projectInfo?.description?.trim()) {
        errors.push('Project description is required');
      }
      break;

    case 2: // Timeline
      if (!data.timeline?.startDate) {
        errors.push('Start date is required');
      }
      if (!data.timeline?.estimatedDuration) {
        errors.push('Estimated duration is required');
      }
      break;

    case 3: // Stakeholders
      if (!data.stakeholders?.projectManager?.name?.trim()) {
        errors.push('Project manager name is required');
      }
      if (!data.stakeholders?.projectManager?.email?.trim()) {
        errors.push('Project manager email is required');
      }
      // Email validation
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (data.stakeholders?.projectManager?.email && !emailRegex.test(data.stakeholders.projectManager.email)) {
        errors.push('Project manager email is invalid');
      }
      break;

    case 4: // Requirements
      // Requirements are optional but can be validated if needed
      break;

    case 5: // Integration
      // GitHub repo validation can be done here
      if (data.integration?.githubRepo) {
        const githubRegex = /^https:\/\/github\.com\/[\w\-._]+\/[\w\-._]+$/;
        if (!githubRegex.test(data.integration.githubRepo)) {
          errors.push('GitHub repository URL format is invalid');
        }
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Local storage helpers for offline draft saving
export function saveProjectDraftLocal(data: Partial<ProjectFormData>): void {
  try {
    const draftData = {
      data,
      lastSaved: new Date().toISOString(),
      id: 'local-draft'
    };
    localStorage.setItem('project-setup-draft', JSON.stringify(draftData));
  } catch (error) {
    console.error('Error saving draft to local storage:', error);
  }
}

export function loadProjectDraftLocal(): Partial<ProjectFormData> | null {
  try {
    const stored = localStorage.getItem('project-setup-draft');
    if (stored) {
      const draftData = JSON.parse(stored);
      return draftData.data;
    }
    return null;
  } catch (error) {
    console.error('Error loading draft from local storage:', error);
    return null;
  }
}

export function clearProjectDraftLocal(): void {
  try {
    localStorage.removeItem('project-setup-draft');
  } catch (error) {
    console.error('Error clearing local draft:', error);
  }
}