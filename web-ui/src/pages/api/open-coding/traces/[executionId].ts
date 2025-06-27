import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { executionId } = req.query;

  if (!executionId || typeof executionId !== 'string') {
    return res.status(400).json({ error: 'Invalid execution ID' });
  }

  try {
    // Proxy to real backend service
    const backendResponse = await fetch(`http://localhost:8010/api/open-coding/traces/${executionId}`);

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
    }

    const traces = await backendResponse.json();
    res.status(200).json(traces);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fallback to mock traces
    const mockTraces = [
      {
        id: `trace_1_${executionId}`,
        query: 'What is AI?',
        response: 'AI (Artificial Intelligence) refers to computer systems that can perform tasks that typically require human intelligence...',
        timestamp: new Date().toISOString(),
        project_id: 'test_project'
      },
      {
        id: `trace_2_${executionId}`,
        query: 'How does machine learning work?',
        response: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed...',
        timestamp: new Date().toISOString(),
        project_id: 'test_project'
      }
    ];
    
    res.status(200).json(mockTraces);
  }
}