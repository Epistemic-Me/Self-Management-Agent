/**
 * @jest-environment jsdom
 */

import { 
  getProjectState, 
  saveProjectState, 
  isProjectSetup, 
  getProjectSummary,
  clearProjectState
} from '@/lib/project-state';
import type { ProjectFormData } from '@/components/ProjectSetup/ProjectSetupWizard';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Project State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProjectData: ProjectFormData = {
    projectInfo: {
      name: 'Test Project',
      description: 'A test project description',
    },
    timeline: {
      startDate: '2024-01-15',
      estimatedDuration: '2-3 months',
    },
    stakeholders: {
      projectManager: {
        name: 'John Manager',
        email: 'john@example.com',
      },
      teamMembers: [
        {
          name: 'Jane Developer',
          email: 'jane@example.com',
          role: 'Developer',
        },
      ],
    },
    requirements: {
      objectives: ['Objective 1', 'Objective 2'],
      constraints: ['Constraint 1'],
      success_criteria: ['Success 1'],
    },
    integration: {
      githubRepo: 'https://github.com/test/repo',
      apiEndpoints: ['api1', 'api2'],
      notifications: {
        email: true,
        slack: false,
        teams: false,
      },
    },
    promptConfiguration: {
      systemPrompt: 'You are a helpful assistant.',
      description: 'Test prompt',
      version: 'v1.0',
    },
  };

  describe('getProjectState', () => {
    it('should return default state when no data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const state = getProjectState();
      
      expect(state).toEqual({ isSetup: false });
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('epistemic_me_project');
    });

    it('should return parsed state when data exists', () => {
      const storedState = {
        isSetup: true,
        projectData: mockProjectData,
        setupCompleted: '2024-01-15T00:00:00.000Z',
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState));
      
      const state = getProjectState();
      
      expect(state.isSetup).toBe(true);
      expect(state.projectData).toEqual(mockProjectData);
    });

    it('should handle JSON parse errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const state = getProjectState();
      
      expect(state).toEqual({ isSetup: false });
    });
  });

  describe('saveProjectState', () => {
    it('should save project data to localStorage', () => {
      saveProjectState(mockProjectData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'epistemic_me_project',
        expect.stringContaining('"isSetup":true')
      );
    });
  });

  describe('isProjectSetup', () => {
    it('should return false when no project exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(isProjectSetup()).toBe(false);
    });

    it('should return true when project exists and has data', () => {
      const storedState = {
        isSetup: true,
        projectData: mockProjectData,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState));
      
      expect(isProjectSetup()).toBe(true);
    });
  });

  describe('getProjectSummary', () => {
    it('should return null when no project data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(getProjectSummary()).toBeNull();
    });

    it('should return project summary when data exists', () => {
      const storedState = {
        isSetup: true,
        projectData: mockProjectData,
        setupCompleted: '2024-01-15T00:00:00.000Z',
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState));
      
      const summary = getProjectSummary();
      
      expect(summary).toEqual({
        name: 'Test Project',
        description: 'A test project description',
        startDate: '2024-01-15',
        duration: '2-3 months',
        teamSize: 2, // 1 manager + 1 team member
        objectives: 2,
        setupDate: '2024-01-15T00:00:00.000Z',
        lastModified: '',
      });
    });
  });

  describe('clearProjectState', () => {
    it('should remove data from localStorage', () => {
      clearProjectState();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('epistemic_me_project');
    });
  });
});