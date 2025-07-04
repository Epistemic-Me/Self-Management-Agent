import { NextApiRequest, NextApiResponse } from 'next';
import type { AgentHierarchy, HierarchyNode } from '@/types/agent-evaluation';

const HEALTH_COACH_API_KEY = process.env.HEALTH_COACH_API_KEY || 'test-key';
const HEALTH_COACH_URL = process.env.HEALTH_COACH_URL || 'http://localhost:8060';

// Function to transform health coach hierarchy to agent evaluation format
function transformToAgentHierarchy(healthCoachData: any): AgentHierarchy {
  const hierarchy = healthCoachData.hierarchy;
  const stats = healthCoachData.stats;
  
  // Find the root node
  const rootHierarchyNode = hierarchy.find((node: any) => node.type === 'root');
  
  // Transform hierarchy nodes to evaluation format
  const transformedNodes: { [key: string]: HierarchyNode } = {};
  
  // Build a map of all nodes
  hierarchy.forEach((node: any) => {
    transformedNodes[node.id] = {
      id: node.id,
      name: node.name,
      type: node.type,
      icon: getIconForType(node.type),
      description: node.description,
      metrics: {
        success: 0.85 + Math.random() * 0.15, // Mock success rate
        coverage: 0.80 + Math.random() * 0.15, // Mock coverage
        queries: Math.floor(Math.random() * 1000) + 100 // Mock query count
      },
      constraints: node.metadata?.constraints?.map((c: any) => ({
        id: c.id,
        text: c.description,
        category: c.type
      })) || [],
      children: [], // Will be populated below
      failureModes: generateMockFailureModes(node.type),
      evaluationMetrics: generateMockEvaluationMetrics(),
      sampleQueries: node.metadata?.example_queries?.map((q: string, i: number) => ({
        id: `${node.id}_q${i}`,
        text: q
      })) || []
    };
  });
  
  // Build parent-child relationships
  hierarchy.forEach((node: any) => {
    if (node.children && transformedNodes[node.id]) {
      transformedNodes[node.id].children = node.children
        .map((childId: string) => transformedNodes[childId])
        .filter((child: any) => child !== undefined);
    }
  });
  
  const agentHierarchy: AgentHierarchy = {
    id: healthCoachData.metadata?.version || 'default',
    name: rootHierarchyNode?.name || 'AI Health Coach Agent',
    description: healthCoachData.metadata?.description || 'Hierarchical constraint-based evaluation system for health coaching',
    root_node: transformedNodes[rootHierarchyNode?.id] || createFallbackRootNode(),
    tier_info: {
      root: {
        icon: '🏥',
        title: 'Root Agent',
        description: 'Top-level agent definition with overall system metrics',
        example: 'Example: "AI Health Coach" - Complete health assistant system'
      },
      cohort: {
        icon: '👥',
        title: 'Cohort',
        description: 'User segments based on current habits and knowledge level',
        example: 'Example: "Health Enthusiast" - Regular exerciser with intermediate knowledge'
      },
      intent: {
        icon: '🎯',
        title: 'Intent Class',
        description: 'High-level user goals that cut across domains',
        example: 'Example: "Evidence Research" - Seeking scientific backing for decisions'
      },
      category: {
        icon: '📂',
        title: 'Category',
        description: 'Domain-specific divisions with unique data sources',
        example: 'Example: "Exercise" - Physical activity protocols and research'
      },
      subintent: {
        icon: '🔧',
        title: 'Sub-intent',
        description: 'Granular handlers with precise constraints',
        example: 'Example: "Meta-Analysis Review" - Synthesize multiple studies'
      }
    },
    created_at: healthCoachData.metadata?.generated_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return agentHierarchy;
}

function createFallbackRootNode(): HierarchyNode {
  return {
    id: 'root',
    name: 'AI Health Coach',
    type: 'root',
    icon: '🏥',
    description: 'AI Health Coach with hierarchical constraint system',
    metrics: { success: 0.92, coverage: 0.85 },
    constraints: [
      { id: 'r1', text: 'Always prioritize user safety and well-being', category: 'safety' },
      { id: 'r2', text: 'Evidence-based recommendations only', category: 'data_sources' }
    ],
    children: []
  };
}

function getIconForType(type: string): string {
  const iconMap: { [key: string]: string } = {
    'root': '🏥',
    'cohort_level': '👥',
    'cohort': '👤',
    'intent_level': '🎯',
    'intent': '📋',
    'category_level': '📂',
    'category': '📊',
    'sub_intent_level': '🔧',
    'sub_intent': '⚙️'
  };
  return iconMap[type] || '📄';
}

function generateMockFailureModes(type: string) {
  if (type === 'sub_intent') {
    return [
      {
        id: 'fm1',
        name: 'Constraint Violation',
        description: 'Response violates defined constraints',
        severity: 'high' as const,
        mitigation: 'Automated constraint validation'
      },
      {
        id: 'fm2',
        name: 'Scope Creep',
        description: 'Response exceeds intended scope',
        severity: 'medium' as const,
        mitigation: 'Boundary enforcement algorithms'
      }
    ];
  }
  return [];
}

function generateMockEvaluationMetrics() {
  return {
    'Constraint Adherence': 0.85 + Math.random() * 0.15,
    'Response Quality': 0.80 + Math.random() * 0.15,
    'Scope Adherence': 0.75 + Math.random() * 0.20,
    'User Satisfaction': 0.82 + Math.random() * 0.15
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch hierarchy from health coach service
      const response = await fetch(`${HEALTH_COACH_URL}/evaluation/hierarchy`, {
        headers: {
          'Authorization': `Bearer ${HEALTH_COACH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch hierarchy:', response.statusText);
        // Fallback to simplified mock data
        return res.status(200).json(createFallbackHierarchy());
      }
      
      const healthCoachData = await response.json();
      const transformedHierarchy = transformToAgentHierarchy(healthCoachData);
      
      res.status(200).json(transformedHierarchy);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      // Fallback to simplified mock data
      res.status(200).json(createFallbackHierarchy());
    }
  } else if (req.method === 'PUT') {
    // Update the agent hierarchy
    // In a real implementation, this would save to a database
    const updatedHierarchy = req.body;
    
    // For now, just return the updated hierarchy with new timestamp
    updatedHierarchy.updated_at = new Date().toISOString();
    
    res.status(200).json(updatedHierarchy);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function createFallbackHierarchy(): AgentHierarchy {
  return {
    id: 'fallback',
    name: 'AI Health Coach Agent (Fallback)',
    description: 'Hierarchical constraint-based evaluation system for health coaching',
    root_node: {
      id: 'root',
      name: 'AI Health Coach',
      type: 'root',
      icon: '🏥',
      description: 'AI Health Coach with hierarchical constraint system',
      metrics: { success: 0.92, coverage: 0.85 },
      constraints: [
        { id: 'r1', text: 'Always prioritize user safety and well-being', category: 'safety' },
        { id: 'r2', text: 'No medical diagnosis or treatment advice', category: 'scope_boundaries' },
        { id: 'r3', text: 'Evidence-based recommendations only', category: 'data_sources' }
      ],
      children: [
        {
          id: 'health-enthusiast',
          name: 'Health Enthusiast',
          type: 'cohort',
          icon: '👥',
          description: 'Regular exercise, decent sleep patterns',
          metrics: { success: 0.89, users: 1250 },
          constraints: [
            { id: 'he1', text: 'Assume intermediate knowledge of health concepts', category: 'tone' },
            { id: 'he2', text: 'Focus on optimization rather than basic habits', category: 'scope_boundaries' }
          ],
          children: [
            {
              id: 'he-evidence',
              name: 'Evidence Research',
              type: 'intent',
              icon: '🎯',
              description: 'Scientific literature analysis',
              metrics: { success: 0.91, queries: 3400 },
              constraints: [
                { id: 'ev1', text: 'Peer-reviewed sources only', category: 'data_sources' },
                { id: 'ev2', text: 'Must cite specific studies with details', category: 'output_format' }
              ],
              children: []
            }
          ]
        }
      ]
    },
    tier_info: {
      root: {
        icon: '🏥',
        title: 'Root Agent',
        description: 'Top-level agent definition with overall system metrics',
        example: 'Example: "AI Health Coach" - Complete health assistant system'
      },
      cohort: {
        icon: '👥',
        title: 'Cohort',
        description: 'User segments based on current habits and knowledge level',
        example: 'Example: "Health Enthusiast" - Regular exerciser with intermediate knowledge'
      },
      intent: {
        icon: '🎯',
        title: 'Intent Class',
        description: 'High-level user goals that cut across domains',
        example: 'Example: "Evidence Research" - Seeking scientific backing for decisions'
      },
      category: {
        icon: '📂',
        title: 'Category',
        description: 'Domain-specific divisions with unique data sources',
        example: 'Example: "Exercise" - Physical activity protocols and research'
      },
      subintent: {
        icon: '🔧',
        title: 'Sub-intent',
        description: 'Granular handlers with precise constraints',
        example: 'Example: "Meta-Analysis Review" - Synthesize multiple studies'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}