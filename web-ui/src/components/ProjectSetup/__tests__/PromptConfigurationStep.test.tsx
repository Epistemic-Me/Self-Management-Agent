import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptConfigurationStep } from '../PromptConfigurationStep';

// Mock the toast function
jest.mock('@/components/ui/use-toast');

// Mock project state functions
jest.mock('@/lib/project-state', () => ({
  getProjectState: () => ({ isSetup: false }),
  isProjectSetup: () => false,
  getProjectSummary: () => null,
}));

// Mock PromptTestingWorkbench
jest.mock('../PromptTestingWorkbench', () => ({
  PromptTestingWorkbench: ({ systemPrompt, onSystemPromptChange }: any) => (
    <div data-testid="prompt-testing-workbench">
      <textarea
        data-testid="workbench-prompt-input"
        value={systemPrompt}
        onChange={(e) => onSystemPromptChange(e.target.value)}
      />
    </div>
  ),
}));

describe('PromptConfigurationStep', () => {
  const mockProps = {
    systemPrompt: '',
    onSystemPromptChange: jest.fn(),
    onSave: jest.fn(),
    onContinueToEvaluation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header and templates', () => {
    render(<PromptConfigurationStep {...mockProps} />);
    
    expect(screen.getByText('Configure Your AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Quick Start Templates')).toBeInTheDocument();
    expect(screen.getByText('Customer Support')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Educational Tutor')).toBeInTheDocument();
    
    // Check that sample queries are displayed
    expect(screen.getByText('"I\'m having trouble logging into my account"')).toBeInTheDocument();
    expect(screen.getByText('"Please review this function for potential bugs"')).toBeInTheDocument();
    expect(screen.getByText('"Can you explain how photosynthesis works?"')).toBeInTheDocument();
  });

  it('hides templates when system prompt has content', () => {
    const props = { ...mockProps, systemPrompt: 'Some existing prompt' };
    render(<PromptConfigurationStep {...props} />);
    
    expect(screen.queryByText('Quick Start Templates')).not.toBeInTheDocument();
  });

  it('calls onSystemPromptChange when template is selected', () => {
    render(<PromptConfigurationStep {...mockProps} />);
    
    const customerSupportTemplate = screen.getByTestId('template-customer-support');
    fireEvent.click(customerSupportTemplate);
    
    expect(mockProps.onSystemPromptChange).toHaveBeenCalledWith(
      expect.stringContaining('## Bot\'s Role & Objective')
    );
  });

  it('renders prompt testing workbench', () => {
    render(<PromptConfigurationStep {...mockProps} />);
    
    expect(screen.getByTestId('prompt-testing-workbench')).toBeInTheDocument();
  });

  it('displays prompt writing guidelines', () => {
    render(<PromptConfigurationStep {...mockProps} />);
    
    expect(screen.getByText('Prompt Writing Tips')).toBeInTheDocument();
    expect(screen.getByText('✨ Best Practices:')).toBeInTheDocument();
    expect(screen.getByText('🧪 Testing Strategy:')).toBeInTheDocument();
    expect(screen.getByText('Be specific about the role and behavior')).toBeInTheDocument();
    expect(screen.getByText('Test with various types of inputs')).toBeInTheDocument();
  });

  it('has correct test ids for accessibility', () => {
    render(<PromptConfigurationStep {...mockProps} />);
    
    expect(screen.getByTestId('step-prompt-configuration')).toBeInTheDocument();
    expect(screen.getByTestId('template-customer-support')).toBeInTheDocument();
    expect(screen.getByTestId('template-code-reviewer')).toBeInTheDocument();
    expect(screen.getByTestId('template-educational-tutor')).toBeInTheDocument();
  });
});