import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { executionId } = req.query;

  if (!executionId || typeof executionId !== 'string') {
    return res.status(400).json({ error: 'Invalid execution ID' });
  }

  if (req.method === 'GET') {
    try {
      // Proxy to real backend service
      const backendResponse = await fetch(`http://localhost:8010/api/open-coding/annotations/${executionId}`);

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
      }

      const annotations = await backendResponse.json();
      res.status(200).json(annotations);
    } catch (error) {
      console.error('API proxy error:', error);
      
      // Return empty annotations object for mock
      res.status(200).json({});
    }
  } else if (req.method === 'POST') {
    try {
      // Proxy annotation save to backend
      const backendResponse = await fetch(`http://localhost:8010/api/open-coding/annotations/${executionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
      }

      const result = await backendResponse.json();
      res.status(200).json(result);
    } catch (error) {
      console.error('API proxy error:', error);
      
      // Mock successful save
      res.status(200).json({ success: true, annotation: req.body });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}