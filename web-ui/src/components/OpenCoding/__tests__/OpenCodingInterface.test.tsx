import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpenCodingInterface } from '../OpenCodingInterface';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockProps = {
  projectId: 'test-project',
  systemPrompt: 'You are a helpful assistant.',
  sampleQueries: [
    { id: 'query1', text: 'What is AI?' },
    { id: 'query2', text: 'How does machine learning work?' }
  ],
  onComplete: jest.fn()
};

describe('OpenCodingInterface', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders initial state with execute button', () => {
    render(<OpenCodingInterface {...mockProps} />);
    
    expect(screen.getByText('Open Coding Interface')).toBeInTheDocument();
    expect(screen.getByText('Execute Batch (2 queries)')).toBeInTheDocument();
    expect(screen.getByText('How to Use Open Coding')).toBeInTheDocument();
  });

  it('displays execution instructions when no execution has started', () => {
    render(<OpenCodingInterface {...mockProps} />);
    
    expect(screen.getByText('Execute Batch')).toBeInTheDocument();
    expect(screen.getByText('Annotate Traces')).toBeInTheDocument();
    expect(screen.getByText('Export Analysis')).toBeInTheDocument();
  });

  it('shows loading state during batch execution', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 2
        })
      } as Response), 100))
    );

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  it('handles successful batch execution', async () => {
    const mockTraces = [
      {
        id: 'trace1',
        query: 'What is AI?',
        response: 'AI is artificial intelligence...',
        timestamp: '2024-01-01T00:00:00Z',
        project_id: 'test-project'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 1
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTraces)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_traces: 1,
          annotated_traces: 0,
          completion_percentage: 0
        })
      } as Response);

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Trace 1 of 1')).toBeInTheDocument();
    });

    expect(screen.getByText('What is AI?')).toBeInTheDocument();
    expect(screen.getByText('AI is artificial intelligence...')).toBeInTheDocument();
  });

  it('displays failure modes checkboxes', async () => {
    const mockTraces = [
      {
        id: 'trace1',
        query: 'What is AI?',
        response: 'AI is artificial intelligence...',
        timestamp: '2024-01-01T00:00:00Z',
        project_id: 'test-project'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 1
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTraces)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_traces: 1,
          annotated_traces: 0,
          completion_percentage: 0
        })
      } as Response);

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failure Modes')).toBeInTheDocument();
    });

    expect(screen.getByText('Incomplete Response')).toBeInTheDocument();
    expect(screen.getByText('Hallucination Issues')).toBeInTheDocument();
    expect(screen.getByText('Prompt Instructions Ignored')).toBeInTheDocument();
  });

  it('allows annotation input and saving', async () => {
    const mockTraces = [
      {
        id: 'trace1',
        query: 'What is AI?',
        response: 'AI is artificial intelligence...',
        timestamp: '2024-01-01T00:00:00Z',
        project_id: 'test-project'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 1
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTraces)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_traces: 1,
          annotated_traces: 0,
          completion_percentage: 0
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Open Coding Notes')).toBeInTheDocument();
    });

    const notesTextarea = screen.getByPlaceholderText('Add qualitative observations, patterns, and insights...');
    fireEvent.change(notesTextarea, { target: { value: 'Test annotation' } });
    
    const saveButton = screen.getByText('Save Annotation');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/open-coding/annotations/test-exec-123',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test annotation')
        })
      );
    });
  });

  it('enables export button after execution', async () => {
    const mockTraces = [
      {
        id: 'trace1',
        query: 'What is AI?',
        response: 'AI is artificial intelligence...',
        timestamp: '2024-01-01T00:00:00Z',
        project_id: 'test-project'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 1
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTraces)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_traces: 1,
          annotated_traces: 0,
          completion_percentage: 0
        })
      } as Response);

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  it('handles navigation between traces', async () => {
    const mockTraces = [
      {
        id: 'trace1',
        query: 'What is AI?',
        response: 'AI is artificial intelligence...',
        timestamp: '2024-01-01T00:00:00Z',
        project_id: 'test-project'
      },
      {
        id: 'trace2',
        query: 'How does ML work?',
        response: 'Machine learning works by...',
        timestamp: '2024-01-01T00:01:00Z',
        project_id: 'test-project'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          execution_id: 'test-exec-123',
          total_traces: 2
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTraces)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_traces: 2,
          annotated_traces: 0,
          completion_percentage: 0
        })
      } as Response);

    render(<OpenCodingInterface {...mockProps} />);
    
    const executeButton = screen.getByText('Execute Batch (2 queries)');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Trace 1 of 2')).toBeInTheDocument();
    });

    expect(screen.getByText('What is AI?')).toBeInTheDocument();
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Trace 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('How does ML work?')).toBeInTheDocument();
  });
});