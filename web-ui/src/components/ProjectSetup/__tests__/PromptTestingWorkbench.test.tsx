import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptTestingWorkbench } from '../PromptTestingWorkbench';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-auth-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the toast function
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock project state functions
jest.mock('@/lib/project-state', () => ({
  getProjectState: () => ({ isSetup: false }),
  isProjectSetup: () => false,
  getProjectSummary: () => null,
}));

describe('PromptTestingWorkbench', () => {
  const mockProps = {
    systemPrompt: 'You are a helpful assistant.',
    onSystemPromptChange: jest.fn(),
    onSave: jest.fn(),
    onContinueToEvaluation: jest.fn(),
    sampleQueries: ['Hello, how are you?', 'What can you help me with?'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders the component with prompt configuration and testing panels', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    expect(screen.getByText('Prompt Configuration')).toBeInTheDocument();
    expect(screen.getByText('Test Your Prompt')).toBeInTheDocument();
    expect(screen.getByTestId('system-prompt-input')).toBeInTheDocument();
    expect(screen.getByTestId('test-message-input')).toBeInTheDocument();
  });

  it('displays the system prompt in the textarea', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    const promptInput = screen.getByTestId('system-prompt-input') as HTMLTextAreaElement;
    expect(promptInput.value).toBe('You are a helpful assistant.');
  });

  it('calls onSystemPromptChange when prompt is edited', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    const promptInput = screen.getByTestId('system-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Updated prompt' } });
    
    expect(mockProps.onSystemPromptChange).toHaveBeenCalledWith('Updated prompt');
  });

  it('shows character count for system prompt', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    expect(screen.getByText('26 characters')).toBeInTheDocument();
  });

  it('disables send button when no system prompt or test message', () => {
    const props = { ...mockProps, systemPrompt: '' };
    render(<PromptTestingWorkbench {...props} />);
    
    const sendButton = screen.getByTestId('send-test-message');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when both system prompt and test message are present', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Hello, how are you?' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    expect(sendButton).not.toBeDisabled();
  });

  it('sends test message and displays conversation', async () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Hello, how are you?' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    fireEvent.click(sendButton);
    
    // Check that user message appears
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    
    // Wait for simulated response
    await waitFor(() => {
      expect(screen.getByText(/Based on the system prompt:/)).toBeInTheDocument();
    });
  });

  it('clears messages when clear button is clicked', async () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    // Send a test message first
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Test message' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    fireEvent.click(sendButton);
    
    // Wait for message to appear
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Clear messages
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Message should be gone
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('calls save API when save button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-id' }),
    });

    render(<PromptTestingWorkbench {...mockProps} />);
    
    const saveButton = screen.getByText('Save Prompt');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/prompts', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_prompt: 'You are a helpful assistant.',
          description: '',
          version: 'v1.0',
        }),
      });
    });
  });

  it('shows evaluation transition when messages exist', async () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    // Send a test message
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Test' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    fireEvent.click(sendButton);
    
    // Wait for response and evaluation button
    await waitFor(() => {
      expect(screen.getByTestId('continue-to-evaluation')).toBeInTheDocument();
    });
  });

  it('calls onContinueToEvaluation when evaluation button is clicked', async () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    // Send a test message first
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Test' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    fireEvent.click(sendButton);
    
    // Wait for evaluation button and click it
    await waitFor(() => {
      const evalButton = screen.getByTestId('continue-to-evaluation');
      fireEvent.click(evalButton);
    });
    
    expect(mockProps.onContinueToEvaluation).toHaveBeenCalled();
  });

  it('displays and handles sample query clicks', () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    // Check that sample queries are displayed
    expect(screen.getByText('Try these sample queries:')).toBeInTheDocument();
    expect(screen.getByText('"Hello, how are you?"')).toBeInTheDocument();
    expect(screen.getByText('"What can you help me with?"')).toBeInTheDocument();
    
    // Click on a sample query
    const sampleQuery = screen.getByTestId('sample-query-0');
    fireEvent.click(sampleQuery);
    
    // Check that the input field is populated
    const testInput = screen.getByTestId('test-message-input') as HTMLInputElement;
    expect(testInput.value).toBe('Hello, how are you?');
  });

  it('hides sample queries after sending a message', async () => {
    render(<PromptTestingWorkbench {...mockProps} />);
    
    // Initially shows sample queries
    expect(screen.getByText('Try these sample queries:')).toBeInTheDocument();
    
    // Send a message
    const testInput = screen.getByTestId('test-message-input');
    fireEvent.change(testInput, { target: { value: 'Test message' } });
    
    const sendButton = screen.getByTestId('send-test-message');
    fireEvent.click(sendButton);
    
    // Sample queries should be hidden
    expect(screen.queryByText('Try these sample queries:')).not.toBeInTheDocument();
  });
});