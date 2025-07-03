import { ProjectFormData } from '@/components/ProjectSetup/ProjectSetupWizard';

// Key for localStorage
const PROJECT_STORAGE_KEY = 'epistemic_me_project';

// Project state interface
export interface ProjectState {
  isSetup: boolean;
  projectData?: ProjectFormData;
  setupCompleted?: string; // timestamp
  lastModified?: string; // timestamp
}

// Get current project state
export function getProjectState(): ProjectState {
  if (typeof window === 'undefined') {
    return { isSetup: false };
  }

  try {
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!stored) {
      return { isSetup: false };
    }

    const parsed = JSON.parse(stored);
    return {
      isSetup: true,
      ...parsed
    };
  } catch (error) {
    console.error('Error reading project state:', error);
    return { isSetup: false };
  }
}

// Save project state
export function saveProjectState(projectData: ProjectFormData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const projectState: ProjectState = {
      isSetup: true,
      projectData,
      setupCompleted: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projectState));
  } catch (error) {
    console.error('Error saving project state:', error);
  }
}

// Update project state
export function updateProjectState(updates: Partial<ProjectFormData>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentState = getProjectState();
    if (!currentState.isSetup || !currentState.projectData) {
      console.warn('Cannot update project state: no project setup found');
      return;
    }

    const updatedProjectData = {
      ...currentState.projectData,
      ...updates
    };

    const updatedState: ProjectState = {
      ...currentState,
      projectData: updatedProjectData,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updatedState));
  } catch (error) {
    console.error('Error updating project state:', error);
  }
}

// Clear project state (for reset/new project)
export function clearProjectState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing project state:', error);
  }
}

// Check if project is setup
export function isProjectSetup(): boolean {
  const state = getProjectState();
  return state.isSetup && !!state.projectData;
}

// Get project info summary
export function getProjectSummary() {
  const state = getProjectState();
  if (!state.projectData) {
    return null;
  }

  const { projectInfo, timeline, stakeholders, requirements } = state.projectData;
  
  return {
    name: projectInfo?.name || 'Untitled Project',
    description: projectInfo?.description || '',
    startDate: timeline?.startDate || '',
    duration: timeline?.estimatedDuration || '',
    teamSize: (stakeholders?.teamMembers?.length || 0) + 1, // +1 for project manager
    objectives: requirements?.objectives?.length || 0,
    setupDate: state.setupCompleted || '',
    lastModified: state.lastModified || ''
  };
}