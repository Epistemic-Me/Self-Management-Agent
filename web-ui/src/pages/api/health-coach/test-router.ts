import { NextApiRequest, NextApiResponse } from 'next';

const HEALTH_COACH_API_KEY = process.env.HEALTH_COACH_API_KEY || 'health_coach_api_key_12345';
const HEALTH_COACH_URL = process.env.HEALTH_COACH_URL || 'http://localhost:8130';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const response = await fetch(`${HEALTH_COACH_URL}/component/test-router`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HEALTH_COACH_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error testing router:', error);
      res.status(500).json({ 
        error: 'Failed to test router component',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}