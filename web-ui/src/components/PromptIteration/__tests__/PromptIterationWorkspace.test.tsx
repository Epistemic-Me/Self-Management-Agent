import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptIterationWorkspace } from '../PromptIterationWorkspace';

// Mock dataset for testing
const mockDataset = {
  id: 'test_dataset',
  name: 'Test Dataset',
  description: 'Test dataset for prompt iteration',
  query_count: 3,
  system_prompt: 'You are a helpful assistant.',
  sample_queries: [
    { id: 'q1', text: 'Test query 1' },
    { id: 'q2', text: 'Test query 2' },
    { id: 'q3', text: 'Test query 3' }
  ]
};

// Mock API responses
global.fetch = jest.fn();

describe('PromptIterationWorkspace', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders with dataset information', () => {
    const mockOnBack = jest.fn();
    
    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    expect(screen.getByText('Prompt Iteration Workspace')).toBeInTheDocument();
    expect(screen.getByText(/Dataset: Test Dataset/)).toBeInTheDocument();
    expect(screen.getByText('Get AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Run Comparison')).toBeInTheDocument();
  });

  test('generates AI suggestions when button clicked', async () => {
    const mockOnBack = jest.fn();
    
    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            id: 'test_suggestion',
            category: 'clarity',
            suggestion: 'Test suggestion',
            reasoning: 'Test reasoning',
            confidence: 0.85,
            applyable: true
          }
        ]
      })
    });

    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    const suggestionsButton = screen.getByText('Get AI Suggestions');
    fireEvent.click(suggestionsButton);

    // Should show loading state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    // Wait for API call to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/prompt-iteration/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"currentPrompt"')
      });
    });
  });

  test('runs comparison when button clicked', async () => {
    const mockOnBack = jest.fn();
    
    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        comparison_id: 'test_comparison',
        traces: [
          {
            id: 'trace_1',
            query: 'Test query 1',
            leftResponse: 'Response A',
            rightResponse: 'Response B',
            leftMetrics: { qualityScore: 75, responseTime: 1200 },
            rightMetrics: { qualityScore: 80, responseTime: 1100 }
          }
        ],
        summary: {
          promptA_avg_quality: 75,
          promptB_avg_quality: 80,
          promptA_avg_time: 1200,
          promptB_avg_time: 1100,
          quality_improvement: 5,
          time_improvement: 100
        }
      })
    });

    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    const compareButton = screen.getByText('Run Comparison');
    fireEvent.click(compareButton);

    // Should show loading state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Wait for API call to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/prompt-iteration/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"testQueries"')
      });
    });
  });

  test('handles API errors gracefully', async () => {
    const mockOnBack = jest.fn();
    
    // Mock API error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    const suggestionsButton = screen.getByText('Get AI Suggestions');
    fireEvent.click(suggestionsButton);

    // Should handle error gracefully and show fallback
    await waitFor(() => {
      expect(screen.queryByText('Analyzing...')).not.toBeInTheDocument();
    });
  });

  test('calls onBack when back button clicked', () => {
    const mockOnBack = jest.fn();
    
    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    const backButton = screen.getByText('Back to Datasets');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('switches between tabs correctly', () => {
    const mockOnBack = jest.fn();
    
    render(
      <PromptIterationWorkspace 
        selectedDataset={mockDataset} 
        onBack={mockOnBack} 
      />
    );

    // Should start on comparison tab
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();

    // Click on suggestions tab
    const suggestionsTab = screen.getByText('AI Suggestions');
    fireEvent.click(suggestionsTab);

    // Should switch to suggestions tab
    expect(screen.getByText(/No suggestions yet/)).toBeInTheDocument();

    // Click on analytics tab
    const analyticsTab = screen.getByText('Performance Analytics');
    fireEvent.click(analyticsTab);

    // Should switch to analytics tab
    expect(screen.getByText(/No analytics data yet/)).toBeInTheDocument();
  });
});