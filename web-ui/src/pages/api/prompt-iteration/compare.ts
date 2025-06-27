import { NextApiRequest, NextApiResponse } from 'next';

// Types
interface ComparisonRequest {
  promptA: {
    id: string;
    content: string;
    version: number;
  };
  promptB: {
    id: string;
    content: string;
    version: number;
  };
  testQueries: Array<{
    id: string;
    text: string;
  }>;
}

interface ComparisonTrace {
  id: string;
  query: string;
  leftResponse: string;
  rightResponse: string;
  leftMetrics: {
    qualityScore: number;
    responseTime: number;
  };
  rightMetrics: {
    qualityScore: number;
    responseTime: number;
  };
}

interface ComparisonResponse {
  comparison_id: string;
  traces: ComparisonTrace[];
  summary: {
    promptA_avg_quality: number;
    promptB_avg_quality: number;
    promptA_avg_time: number;
    promptB_avg_time: number;
    quality_improvement: number;
    time_improvement: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComparisonResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptA, promptB, testQueries }: ComparisonRequest = req.body;

    if (!promptA || !promptB || !testQueries || testQueries.length === 0) {
      return res.status(400).json({ error: 'Missing required comparison data' });
    }

    // Simulate AI testing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock comparison results
    const traces: ComparisonTrace[] = testQueries.map((query, index) => {
      const baseQualityA = 70 + Math.random() * 15; // 70-85 range for prompt A
      const baseQualityB = baseQualityA + (Math.random() - 0.3) * 10; // Slight improvement for B
      const baseTimeA = 1000 + Math.random() * 500; // 1000-1500ms
      const baseTimeB = baseTimeA * (0.8 + Math.random() * 0.3); // Slightly faster for B

      return {
        id: `trace_${index}_${Date.now()}`,
        query: query.text,
        leftResponse: generateMockResponse(query.text, promptA.content, 'A'),
        rightResponse: generateMockResponse(query.text, promptB.content, 'B'),
        leftMetrics: {
          qualityScore: Math.max(0, Math.min(100, baseQualityA)),
          responseTime: Math.round(baseTimeA),
        },
        rightMetrics: {
          qualityScore: Math.max(0, Math.min(100, baseQualityB)),
          responseTime: Math.round(baseTimeB),
        }
      };
    });

    // Calculate summary statistics
    const promptA_avg_quality = traces.reduce((sum, t) => sum + t.leftMetrics.qualityScore, 0) / traces.length;
    const promptB_avg_quality = traces.reduce((sum, t) => sum + t.rightMetrics.qualityScore, 0) / traces.length;
    const promptA_avg_time = traces.reduce((sum, t) => sum + t.leftMetrics.responseTime, 0) / traces.length;
    const promptB_avg_time = traces.reduce((sum, t) => sum + t.rightMetrics.responseTime, 0) / traces.length;

    const response: ComparisonResponse = {
      comparison_id: `comp_${Date.now()}`,
      traces,
      summary: {
        promptA_avg_quality,
        promptB_avg_quality,
        promptA_avg_time,
        promptB_avg_time,
        quality_improvement: promptB_avg_quality - promptA_avg_quality,
        time_improvement: promptA_avg_time - promptB_avg_time, // Positive means B is faster
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error running comparison:', error);
    res.status(500).json({ error: 'Failed to run comparison' });
  }
}

function generateMockResponse(query: string, prompt: string, version: string): string {
  // Generate realistic mock responses based on query and prompt
  const responses = {
    'account': [
      `I'd be happy to help you with your account login issue. Let me walk you through some troubleshooting steps...`,
      `I understand you're having trouble accessing your account. Here are some solutions we can try...`,
      `Account access issues can be frustrating. Let me help you resolve this quickly...`
    ],
    'refund': [
      `I can definitely assist you with processing a refund. Let me check our refund policy and guide you through the process...`,
      `I'd be glad to help with your refund request. Here's what we need to do...`,
      `Refund requests are something I can help with right away. Let me explain the process...`
    ],
    'policy': [
      `I'll be happy to explain our return policy. Here are the key details you need to know...`,
      `Our return policy is designed to be customer-friendly. Let me break it down for you...`,
      `I can provide you with complete details about our return policy...`
    ],
    'code': [
      `Looking at this code, I can identify several areas for improvement. Let me provide a detailed review...`,
      `I'll review this code for potential issues and optimization opportunities...`,
      `Here's my analysis of the code with specific recommendations for improvement...`
    ],
    'performance': [
      `I can suggest several performance optimizations for this code. Here are the key improvements...`,
      `There are multiple ways to improve the performance of this code. Let me prioritize them...`,
      `Performance optimization is important. Here are some specific recommendations...`
    ]
  };

  // Determine response category based on query content
  let category = 'general';
  const queryLower = query.toLowerCase();
  if (queryLower.includes('account') || queryLower.includes('login')) category = 'account';
  else if (queryLower.includes('refund')) category = 'refund';
  else if (queryLower.includes('policy') || queryLower.includes('return')) category = 'policy';
  else if (queryLower.includes('code') || queryLower.includes('review')) category = 'code';
  else if (queryLower.includes('performance')) category = 'performance';

  const responseTemplates = responses[category as keyof typeof responses] || [
    `Thank you for your question. I'll do my best to provide a helpful response...`,
    `I understand your inquiry. Let me address this comprehensively...`,
    `This is an important question. Here's my detailed response...`
  ];

  const baseResponse = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
  
  // Add variation based on prompt version to simulate improvement
  if (version === 'B') {
    return `${baseResponse}\n\n[Enhanced with improved structure and clarity based on prompt optimization]`;
  }
  
  return baseResponse;
}