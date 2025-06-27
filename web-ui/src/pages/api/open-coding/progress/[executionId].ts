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
    const backendResponse = await fetch(`http://localhost:8010/api/open-coding/progress/${executionId}`);

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
    }

    const progress = await backendResponse.json();
    res.status(200).json(progress);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fallback to mock progress
    const mockProgress = {
      total_traces: 2,
      annotated_traces: 0,
      completion_percentage: 0
    };
    
    res.status(200).json(mockProgress);
  }
}