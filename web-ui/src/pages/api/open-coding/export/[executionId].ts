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
    const backendResponse = await fetch(`http://localhost:8010/api/open-coding/export/${executionId}`);

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
    }

    const csvBlob = await backendResponse.blob();
    
    // Set appropriate headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="open_coding_export_${executionId}.csv"`);
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await csvBlob.arrayBuffer());
    res.status(200).send(buffer);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fallback to mock CSV
    const mockCsv = `trace_id,query,response,open_code_notes,failure_modes,timestamp
trace_1_${executionId},"What is AI?","AI refers to computer systems...","Good response","","${new Date().toISOString()}"
trace_2_${executionId},"How does ML work?","Machine learning is...","Could be more detailed","incomplete_response","${new Date().toISOString()}"`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="open_coding_export_${executionId}.csv"`);
    res.status(200).send(mockCsv);
  }
}