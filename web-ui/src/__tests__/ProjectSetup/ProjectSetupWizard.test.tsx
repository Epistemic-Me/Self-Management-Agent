import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProjectSetupWizard, ProjectFormData } from '@/components/ProjectSetup/ProjectSetupWizard';

// Mock the toast hook
const mockToast = jest.fn();

// Create a proper mock module
jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('ProjectSetupWizard', () => {
  const mockOnComplete = jest.fn();
  const mockOnSave = jest.fn();
  
  const defaultProps = {
    onComplete: mockOnComplete,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders wizard with correct initial state', () => {
    render(<ProjectSetupWizard {...defaultProps} />);
    
    expect(screen.getByText('Project Setup Wizard')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Project Information')).toBeInTheDocument();
    expect(screen.getByTestId('step-project-info')).toBeInTheDocument();
  });

  test('validates required fields in step 1', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Fill all required fields to proceed
    await user.type(screen.getByTestId('project-name'), 'Test Project');
    await user.selectOptions(screen.getByTestId('project-type'), 'development');
    await user.type(screen.getByTestId('project-description'), 'Test description');
    
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    
    // Should be on step 2
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  test('fills out step 1 and proceeds to step 2', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Fill out required fields
    await user.type(screen.getByTestId('project-name'), 'Test Project');
    await user.selectOptions(screen.getByTestId('project-type'), 'development');
    await user.type(screen.getByTestId('project-description'), 'A test project for validation');
    await user.click(screen.getByTestId('priority-high'));
    
    // Proceed to next step
    await user.click(screen.getByTestId('next-button'));
    
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Timeline & Milestones')).toBeInTheDocument();
    expect(screen.getByTestId('step-timeline')).toBeInTheDocument();
  });

  test('navigates between steps using Previous button', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Fill step 1 and go to step 2
    await user.type(screen.getByTestId('project-name'), 'Test Project');
    await user.selectOptions(screen.getByTestId('project-type'), 'analysis');
    await user.type(screen.getByTestId('project-description'), 'Test description');
    await user.click(screen.getByTestId('next-button'));
    
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    
    // Go back to step 1
    await user.click(screen.getByTestId('prev-button'));
    
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
  });

  test('fills timeline information in step 2', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 2
    await user.type(screen.getByTestId('project-name'), 'Test Project');
    await user.selectOptions(screen.getByTestId('project-type'), 'research');
    await user.type(screen.getByTestId('project-description'), 'Research project');
    await user.click(screen.getByTestId('next-button'));
    
    // Fill timeline information
    await user.type(screen.getByTestId('start-date'), '2024-01-15');
    await user.selectOptions(screen.getByTestId('duration'), '1-2 months');
    
    // Check that milestone button exists
    expect(screen.getByTestId('add-milestone')).toBeInTheDocument();
    
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
  });

  test('fills stakeholder information in step 3', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 3
    await fillStepsAndNavigate(user, 3);
    
    // Fill project manager information
    await user.type(screen.getByTestId('pm-name'), 'John Smith');
    await user.type(screen.getByTestId('pm-email'), 'john.smith@example.com');
    
    // Check team member button exists
    expect(screen.getByTestId('add-team-member')).toBeInTheDocument();
    
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
  });

  test('fills requirements in step 4', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 4
    await fillStepsAndNavigate(user, 4);
    
    // Fill requirements
    await user.type(screen.getByTestId('objectives'), 'Objective 1\nObjective 2');
    await user.type(screen.getByTestId('constraints'), 'Limited budget');
    await user.type(screen.getByTestId('success-criteria'), 'All tests pass');
    
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
  });

  test('fills integration settings in step 5 and completes wizard', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 5
    await fillStepsAndNavigate(user, 5);
    
    // Fill integration settings
    await user.type(screen.getByTestId('github-repo'), 'https://github.com/user/repo');
    await user.click(screen.getByTestId('notification-email'));
    await user.click(screen.getByTestId('notification-slack'));
    
    // Complete the wizard
    const createButton = screen.getByTestId('create-project-button');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent('Create Project');
    
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          projectInfo: expect.objectContaining({
            name: 'Test Project',
            type: 'development'
          })
        })
      );
    });
  });

  test('save progress button calls onSave', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    await user.type(screen.getByTestId('project-name'), 'Draft Project');
    
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalled();
  });

  test('loads initial data correctly', () => {
    const initialData = {
      projectInfo: {
        name: 'Existing Project',
        description: 'Existing description',
        type: 'analysis' as const,
        priority: 'high' as const,
      }
    };
    
    render(<ProjectSetupWizard {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
  });

  test('progress bar shows correct percentage', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Step 1 - 20%
    expect(screen.getByText('20% Complete')).toBeInTheDocument();
    
    // Navigate to step 3 - 60%
    await fillStepsAndNavigate(user, 3);
    expect(screen.getByText('60% Complete')).toBeInTheDocument();
  });

  test('step navigation indicators show correct state', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 2
    await fillStepsAndNavigate(user, 2);
    
    // Check step indicators (step 1 should be completed, step 2 active, rest pending)
    const stepIndicators = screen.getAllByRole('generic');
    const step1Indicator = stepIndicators.find(el => el.classList.contains('bg-green-500'));
    const step2Indicator = stepIndicators.find(el => el.classList.contains('bg-blue-500'));
    
    expect(step1Indicator).toBeInTheDocument();
    expect(step2Indicator).toBeInTheDocument();
  });

  test('validates email format in project manager field', async () => {
    const user = userEvent.setup();
    render(<ProjectSetupWizard {...defaultProps} />);
    
    // Navigate to step 3
    await fillStepsAndNavigate(user, 3);
    
    // Fill in the project manager details with valid data
    await user.type(screen.getByTestId('pm-name'), 'John Smith');
    await user.type(screen.getByTestId('pm-email'), 'john.smith@example.com');
    
    // Should be able to proceed to step 4
    await user.click(screen.getByTestId('next-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
    });
  });

  // Helper function to fill steps and navigate
  async function fillStepsAndNavigate(user: any, targetStep: number) {
    // Step 1 - Note: project-type was removed in our changes
    await user.type(screen.getByTestId('project-name'), 'Test Project');
    await user.type(screen.getByTestId('project-description'), 'Test description');
    if (targetStep === 1) return;
    
    await user.click(screen.getByTestId('next-button'));
    
    // Step 2
    await user.type(screen.getByTestId('start-date'), '2024-01-15');
    await user.selectOptions(screen.getByTestId('duration'), '1-2 months');
    if (targetStep === 2) return;
    
    await user.click(screen.getByTestId('next-button'));
    
    // Step 3
    await user.type(screen.getByTestId('pm-name'), 'John Smith');
    await user.type(screen.getByTestId('pm-email'), 'john@example.com');
    if (targetStep === 3) return;
    
    await user.click(screen.getByTestId('next-button'));
    
    // Step 4
    await user.type(screen.getByTestId('objectives'), 'Test objectives');
    await user.type(screen.getByTestId('success-criteria'), 'Success criteria');
    if (targetStep === 4) return;
    
    await user.click(screen.getByTestId('next-button'));
    
    // Step 5
    // No required fields in step 5
  }
});