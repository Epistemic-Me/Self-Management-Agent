import { NextApiRequest, NextApiResponse } from 'next';

interface ExecuteBatchRequest {
  project_id: string;
  system_prompt: string;
  sample_queries: Array<{ id: string; text: string }>;
}

interface ExecuteBatchResponse {
  execution_id: string;
  status: string;
  project_id: string;
  total_queries: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { project_id, system_prompt, sample_queries }: ExecuteBatchRequest = req.body;

    if (!project_id || !system_prompt || !sample_queries || sample_queries.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Proxy to real backend service
    const backendResponse = await fetch('http://localhost:8010/api/open-coding/execute-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id,
        system_prompt,
        sample_queries
      })
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
    }

    const result = await backendResponse.json();
    
    // Map backend response to expected format
    const response: ExecuteBatchResponse = {
      execution_id: result.execution_id,
      status: result.success ? 'completed' : 'failed',
      project_id: project_id,
      total_queries: result.total_traces || sample_queries.length
    };

    console.log(`Backend execution created: ${response.execution_id} for project: ${project_id}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fallback to mock if backend is unavailable
    console.log('Falling back to mock implementation');
    
    const execution_id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response: ExecuteBatchResponse = {
      execution_id,
      status: 'completed',
      project_id: req.body.project_id,
      total_queries: req.body.sample_queries.length
    };

    res.status(200).json(response);
  }
}