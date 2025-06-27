import { NextApiRequest, NextApiResponse } from 'next';

// Types
interface AISuggestion {
  id: string;
  category: 'clarity' | 'specificity' | 'format' | 'context';
  suggestion: string;
  reasoning: string;
  confidence: number;
  applyable: boolean;
}

interface SuggestRequest {
  currentPrompt: string;
  traceData?: Array<{
    query: string;
    response: string;
    quality_score?: number;
  }>;
}

interface SuggestResponse {
  suggestions: AISuggestion[];
  analysis_id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuggestResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPrompt, traceData }: SuggestRequest = req.body;

    if (!currentPrompt) {
      return res.status(400).json({ error: 'Current prompt is required' });
    }

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI suggestions based on prompt analysis
    const suggestions: AISuggestion[] = generateMockSuggestions(currentPrompt, traceData);

    const response: SuggestResponse = {
      suggestions,
      analysis_id: `analysis_${Date.now()}`
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}

function generateMockSuggestions(prompt: string, traceData?: any[]): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Analyze prompt for different improvement opportunities
  
  // Check for clarity issues
  if (!prompt.includes('specific') && !prompt.includes('clear')) {
    suggestions.push({
      id: `sug_clarity_${Date.now()}`,
      category: 'clarity',
      suggestion: 'Add explicit output format requirements',
      reasoning: 'The prompt lacks clear formatting instructions, which can lead to inconsistent response structures.',
      confidence: 0.85,
      applyable: true
    });
  }

  // Check for specificity
  if (prompt.length < 100 || (!prompt.includes('example') && !prompt.includes('specific'))) {
    suggestions.push({
      id: `sug_specificity_${Date.now()}`,
      category: 'specificity',
      suggestion: 'Include specific examples of desired responses',
      reasoning: 'Adding concrete examples helps the AI understand the expected quality and style of responses.',
      confidence: 0.78,
      applyable: true
    });
  }

  // Check for context
  if (!prompt.includes('context') && !prompt.includes('background')) {
    suggestions.push({
      id: `sug_context_${Date.now()}`,
      category: 'context',
      suggestion: 'Specify the target audience and use case context',
      reasoning: 'Including context about who will receive the response improves relevance and tone.',
      confidence: 0.72,
      applyable: true
    });
  }

  // Check for format structure
  if (!prompt.includes('format') && !prompt.includes('structure')) {
    suggestions.push({
      id: `sug_format_${Date.now()}`,
      category: 'format',
      suggestion: 'Define specific response structure and formatting rules',
      reasoning: 'Structured formatting instructions ensure consistent, professional-looking outputs.',
      confidence: 0.67,
      applyable: true
    });
  }

  // Add trace-based suggestions if trace data is available
  if (traceData && traceData.length > 0) {
    const avgQuality = traceData.reduce((sum, trace) => sum + (trace.quality_score || 75), 0) / traceData.length;
    
    if (avgQuality < 80) {
      suggestions.push({
        id: `sug_performance_${Date.now()}`,
        category: 'specificity',
        suggestion: 'Add constraints to prevent common response issues',
        reasoning: `Current average quality score is ${avgQuality.toFixed(1)}%. Adding specific constraints can improve consistency.`,
        confidence: 0.82,
        applyable: true
      });
    }
  }

  // Always provide at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      id: `sug_general_${Date.now()}`,
      category: 'clarity',
      suggestion: 'Add role clarity and response expectations',
      reasoning: 'Defining the AI\'s role and what constitutes a good response improves overall performance.',
      confidence: 0.75,
      applyable: true
    });
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions max
}