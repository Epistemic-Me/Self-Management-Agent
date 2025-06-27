import { NextApiRequest, NextApiResponse } from 'next';

// Types
interface AnnotationData {
  trace_id: string;
  open_code_notes: string;
  failure_modes: Record<string, boolean>;
  timestamp?: string;
}

interface FailureModeSummary {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[];
}

interface SummaryResponse {
  execution_id: string;
  total_traces: number;
  annotated_traces: number;
  total_failures: number;
  failure_modes: FailureModeSummary[];
  completion_percentage: number;
}

// Same failure modes as in OpenCodingInterface
const FAILURE_MODES = [
  { id: 'incomplete_response', label: 'Incomplete Response', description: 'Response lacks sufficient detail or completeness' },
  { id: 'hallucination_issues', label: 'Hallucination Issues', description: 'Response contains fabricated or incorrect information' },
  { id: 'prompt_instruction_ignored', label: 'Prompt Instructions Ignored', description: 'Response does not follow given instructions' },
  { id: 'inappropriate_tone', label: 'Inappropriate Tone', description: 'Response tone does not match requirements' },
  { id: 'missing_context_awareness', label: 'Missing Context Awareness', description: 'Response ignores important context' },
  { id: 'factual_accuracy_errors', label: 'Factual Accuracy Errors', description: 'Response contains factual mistakes' },
  { id: 'formatting_inconsistencies', label: 'Formatting Inconsistencies', description: 'Response formatting is inconsistent or poor' },
  { id: 'bias_or_unfairness', label: 'Bias or Unfairness', description: 'Response shows bias or unfair treatment' }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { executionId } = req.query;

  if (!executionId || typeof executionId !== 'string') {
    return res.status(400).json({ error: 'Invalid execution ID' });
  }

  try {
    // In a real implementation, this would fetch from the database
    // For now, return mock data that simulates failure analysis
    
    // Mock annotations data (in real app, fetch from database)
    const mockAnnotations: Record<string, AnnotationData> = {};
    const totalTraces = 5; // Mock total traces
    
    // Generate mock annotation data
    for (let i = 1; i <= totalTraces; i++) {
      mockAnnotations[`trace_${i}`] = {
        trace_id: `trace_${i}`,
        open_code_notes: `Analysis notes for trace ${i}`,
        failure_modes: {
          'incomplete_response': i <= 2, // 2 traces have this issue
          'hallucination_issues': i === 1, // 1 trace has this issue
          'prompt_instruction_ignored': i <= 3, // 3 traces have this issue
          'inappropriate_tone': false,
          'missing_context_awareness': i === 4, // 1 trace has this issue
          'factual_accuracy_errors': false,
          'formatting_inconsistencies': i <= 1, // 1 trace has this issue
          'bias_or_unfairness': false
        },
        timestamp: new Date().toISOString()
      };
    }

    // Analyze failure modes
    const failureModeSummaries: FailureModeSummary[] = FAILURE_MODES.map(mode => {
      const traces: string[] = [];
      let count = 0;

      Object.values(mockAnnotations).forEach(annotation => {
        if (annotation.failure_modes[mode.id]) {
          count++;
          traces.push(annotation.trace_id);
        }
      });

      return {
        id: mode.id,
        label: mode.label,
        description: mode.description,
        count,
        percentage: totalTraces > 0 ? (count / totalTraces) * 100 : 0,
        traces
      };
    });

    // Filter to only include failure modes that occurred
    const relevantFailures = failureModeSummaries.filter(failure => failure.count > 0);

    // Calculate totals
    const totalFailures = relevantFailures.reduce((sum, failure) => sum + failure.count, 0);
    const annotatedTraces = Object.keys(mockAnnotations).length;

    const response: SummaryResponse = {
      execution_id: executionId,
      total_traces: totalTraces,
      annotated_traces: annotatedTraces,
      total_failures: totalFailures,
      failure_modes: relevantFailures.sort((a, b) => b.count - a.count), // Sort by frequency
      completion_percentage: totalTraces > 0 ? (annotatedTraces / totalTraces) * 100 : 0
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating failure mode summary:', error);
    res.status(500).json({ error: 'Failed to generate failure mode summary' });
  }
}