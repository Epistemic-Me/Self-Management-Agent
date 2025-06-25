import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { execution_id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`http://localhost:8010/api/open-coding/export/${execution_id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    // Forward the CSV response
    const csvData = await response.text();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=open_coding_export_${execution_id}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}