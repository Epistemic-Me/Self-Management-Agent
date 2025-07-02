import { NextApiRequest, NextApiResponse } from 'next';
import type { Constraint } from '@/types/agent-evaluation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { nodeId } = req.query;

  if (!nodeId || typeof nodeId !== 'string') {
    return res.status(400).json({ error: 'Invalid node ID' });
  }

  if (req.method === 'GET') {
    // Return constraints for a specific node
    // In a real implementation, this would fetch from a database
    const mockConstraints: Constraint[] = [
      {
        id: 'c1',
        text: 'Peer-reviewed sources only',
        category: 'data_sources'
      },
      {
        id: 'c2', 
        text: 'Academic tone preferred',
        category: 'tone'
      }
    ];

    res.status(200).json({ node_id: nodeId, constraints: mockConstraints });
  } else if (req.method === 'PUT') {
    // Update constraints for a specific node
    const { constraints } = req.body;

    if (!Array.isArray(constraints)) {
      return res.status(400).json({ error: 'Constraints must be an array' });
    }

    // In a real implementation, this would save to a database
    console.log(`Updating constraints for node ${nodeId}:`, constraints);

    res.status(200).json({ 
      node_id: nodeId, 
      constraints,
      updated_at: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}