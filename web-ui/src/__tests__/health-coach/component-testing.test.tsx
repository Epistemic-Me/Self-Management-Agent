/**
 * Regression tests for Health Coach Agent component testing functionality
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComponentTestingModal from '../../components/AgentEvaluation/ComponentTestingModal';

const mockHierarchy = {
  cohorts: [
    {
      id: 'health-coaching',
      name: 'Health Coaching',
      intents: [
        {
          id: 'nutrition',
          name: 'Nutrition',
          categories: [
            {
              id: 'meal-planning',
              name: 'Meal Planning',
              subIntents: [
                {
                  id: 'meal-planning-basics',
                  name: 'Meal Planning Basics',
                  type: 'retriever',
                  description: 'Basic meal planning guidance'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

describe('Component Testing Modal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    node: mockHierarchy.cohorts[0].intents[0].categories[0].subIntents[0],
    nodeType: 'sub-intent' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('renders modal when open', () => {
    render(<ComponentTestingModal {...mockProps} />);
    
    expect(screen.getByText('Test Component: Meal Planning Basics')).toBeInTheDocument();
    expect(screen.getByText('Component Type: Retriever')).toBeInTheDocument();
  });

  test('shows router test interface for router components', () => {
    const routerNode = { ...mockProps.node, type: 'router' };
    render(<ComponentTestingModal {...mockProps} node={routerNode} />);
    
    expect(screen.getByPlaceholderText('Enter your health question...')).toBeInTheDocument();
    expect(screen.getByText('Test Router')).toBeInTheDocument();
  });

  test('shows retriever test interface for retriever components', () => {
    render(<ComponentTestingModal {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Enter query to test retrieval...')).toBeInTheDocument();
    expect(screen.getByText('Test Retriever')).toBeInTheDocument();
  });

  test('shows tool test interface for tool components', () => {
    const toolNode = { ...mockProps.node, type: 'tool' };
    render(<ComponentTestingModal {...mockProps} node={toolNode} />);
    
    expect(screen.getByPlaceholderText('Enter parameters for tool execution...')).toBeInTheDocument();
    expect(screen.getByText('Test Tool')).toBeInTheDocument();
  });

  test('handles test execution and displays results', async () => {
    const mockResponse = {
      success: true,
      result: { confidence: 0.85, route: 'meal-planning-basics' }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<ComponentTestingModal {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Enter query to test retrieval...');
    const testButton = screen.getByText('Test Retriever');
    
    fireEvent.change(input, { target: { value: 'healthy meal ideas' } });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ComponentTestingModal {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Enter query to test retrieval...');
    const testButton = screen.getByText('Test Retriever');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error.*API Error/)).toBeInTheDocument();
    });
  });

  test('closes modal when close button clicked', () => {
    render(<ComponentTestingModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});

describe('Health Coach API Integration', () => {
  test('router endpoint returns valid routing decision', async () => {
    const response = await fetch('/api/health-coach/test-router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'I need help with meal planning' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('route');
    expect(data).toHaveProperty('confidence');
  });

  test('retriever endpoint returns relevant information', async () => {
    const response = await fetch('/api/health-coach/test-retriever', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nodeId: 'meal-planning-basics',
        query: 'healthy meal ideas' 
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('tool endpoint executes successfully', async () => {
    const response = await fetch('/api/health-coach/test-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nodeId: 'meal-planning-tool',
        parameters: { dietaryRestrictions: 'vegetarian' }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('result');
  });
});