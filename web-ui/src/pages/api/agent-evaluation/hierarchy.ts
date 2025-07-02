import { NextApiRequest, NextApiResponse } from 'next';
import type { AgentHierarchy } from '@/types/agent-evaluation';

// Mock agent hierarchy data with comprehensive constraints
const mockHierarchy: AgentHierarchy = {
  id: 'default',
  name: 'AI Health Coach Agent',
  description: 'Hierarchical constraint-based evaluation system for health coaching',
  root_node: {
    id: 'root',
    name: 'AI Health Coach',
    type: 'root',
    icon: '🏥',
    metrics: { success: 0.92, coverage: 0.85 },
    constraints: [
      { id: 'r1', text: 'Always prioritize user safety and well-being', category: 'safety' },
      { id: 'r2', text: 'No medical diagnosis or treatment advice', category: 'scope_boundaries' },
      { id: 'r3', text: 'Encourage professional consultation when appropriate', category: 'safety' },
      { id: 'r4', text: 'Evidence-based recommendations only', category: 'data_sources' }
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
          { id: 'he2', text: 'Can discuss advanced protocols and nuanced topics', category: 'scope_boundaries' },
          { id: 'he3', text: 'Focus on optimization rather than basic habit formation', category: 'output_format' },
          { id: 'he4', text: 'User has established baseline fitness and health habits', category: 'assumptions' }
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
              { id: 'ev2', text: 'Statistical literacy can be assumed', category: 'tone' },
              { id: 'ev3', text: 'Academic tone preferred but accessible', category: 'tone' },
              { id: 'ev4', text: 'Must cite specific studies with details', category: 'output_format' },
              { id: 'ev5', text: 'Acknowledge limitations and confidence intervals', category: 'output_format' }
            ],
            failureModes: [
              {
                id: 'fm1',
                name: 'Hallucinated Citations',
                description: 'Inventing or misrepresenting research',
                severity: 'high',
                mitigation: 'Reference validation against PubMed'
              },
              {
                id: 'fm2',
                name: 'Oversimplification',
                description: 'Losing nuance in translation',
                severity: 'medium',
                mitigation: 'Complexity scoring algorithm'
              }
            ],
            evaluationMetrics: {
              'Citation Accuracy': 0.95,
              'Statistical Correctness': 0.93,
              'Scope Adherence': 0.91,
              'Tone Appropriateness': 0.94
            },
            children: [
              {
                id: 'he-ev-exercise',
                name: 'Exercise',
                type: 'category',
                icon: '📂',
                description: 'Exercise science and protocols',
                metrics: { success: 0.93, queries: 1200 },
                constraints: [
                  { id: 'ex1', text: 'Focus on exercise physiology and biomechanics', category: 'scope_boundaries' },
                  { id: 'ex2', text: 'Include practical implementation guidance', category: 'output_format' },
                  { id: 'ex3', text: 'Address individual variation and adaptations', category: 'tone' }
                ],
                children: [
                  {
                    id: 'he-ev-ex-meta',
                    name: 'Meta-Analysis Review',
                    type: 'subintent',
                    icon: '🔧',
                    description: 'Synthesize exercise meta-analyses',
                    metrics: { success: 0.95, coverage: 0.88, queries: 450 },
                    constraints: [
                      { id: 'meta1', text: 'Only peer-reviewed meta-analyses from last 10 years', category: 'data_sources' },
                      { id: 'meta2', text: 'Must include effect sizes with confidence intervals', category: 'output_format' },
                      { id: 'meta3', text: 'Heterogeneity assessment (I²) required', category: 'validation' },
                      { id: 'meta4', text: 'Quality assessment using GRADE framework', category: 'validation' },
                      { id: 'meta5', text: 'Minimum 5 included studies per meta-analysis', category: 'data_sources' },
                      { id: 'meta6', text: 'Focus on aggregate findings only', category: 'scope_boundaries' }
                    ],
                    failureModes: [
                      {
                        id: 'fm3',
                        name: 'Hallucinated Study Citation',
                        description: 'Inventing or misrepresenting meta-analyses',
                        severity: 'high',
                        mitigation: 'Reference validation against PubMed'
                      },
                      {
                        id: 'fm4',
                        name: 'Individual Study Confusion',
                        description: 'Citing single studies as meta-analyses',
                        severity: 'medium',
                        mitigation: 'Explicit prompt constraints'
                      },
                      {
                        id: 'fm5',
                        name: 'Overstated Conclusions',
                        description: 'Claims beyond evidence support',
                        severity: 'high',
                        mitigation: 'Conclusion scope validator'
                      }
                    ],
                    evaluationMetrics: {
                      'Citation Accuracy': 0.95,
                      'Statistical Correctness': 0.93,
                      'Scope Adherence': 0.91,
                      'Tone Appropriateness': 0.94
                    },
                    sampleQueries: [
                      { id: 'q1', text: 'What do meta-analyses say about training frequency?' },
                      { id: 'q2', text: 'Summarize evidence on HIIT vs steady-state cardio' },
                      { id: 'q3', text: 'Optimal volume for strength gains according to research' }
                    ]
                  },
                  {
                    id: 'he-ev-ex-rct',
                    name: 'RCT Analysis',
                    type: 'subintent',
                    icon: '🔧',
                    description: 'Analyze specific RCTs',
                    metrics: { success: 0.91, coverage: 0.82, queries: 280 },
                    constraints: [
                      { id: 'rct1', text: 'Single study focus only', category: 'scope_boundaries' },
                      { id: 'rct2', text: 'Methods critique required', category: 'output_format' },
                      { id: 'rct3', text: 'Limitation discussion mandatory', category: 'output_format' },
                      { id: 'rct4', text: 'No generalization beyond study population', category: 'scope_boundaries' }
                    ],
                    failureModes: [
                      {
                        id: 'fm6',
                        name: 'Overgeneralization',
                        description: 'Extending findings beyond study scope',
                        severity: 'high',
                        mitigation: 'Scope boundary enforcement'
                      },
                      {
                        id: 'fm7',
                        name: 'Missing Methodology Flaws',
                        description: 'Failing to identify study limitations',
                        severity: 'medium',
                        mitigation: 'Methodology checklist validation'
                      }
                    ]
                  },
                  {
                    id: 'he-ev-ex-bio',
                    name: 'Biohacker Experiments',
                    type: 'subintent',
                    icon: '🔧',
                    description: 'Evaluate n=1 experiments',
                    metrics: { success: 0.87, coverage: 0.75, queries: 180 },
                    constraints: [
                      { id: 'bio1', text: 'Acknowledge n=1 limitations prominently', category: 'output_format' },
                      { id: 'bio2', text: 'No medical advice whatsoever', category: 'safety' },
                      { id: 'bio3', text: 'Context-specific only', category: 'scope_boundaries' },
                      { id: 'bio4', text: 'Safety warnings required', category: 'safety' }
                    ],
                    failureModes: [
                      {
                        id: 'fm8',
                        name: 'Presenting as Generalizable',
                        description: 'Treating n=1 as broadly applicable',
                        severity: 'high',
                        mitigation: 'Disclaimer enforcement'
                      },
                      {
                        id: 'fm9',
                        name: 'Ignoring Safety Concerns',
                        description: 'Missing potential risks',
                        severity: 'high',
                        mitigation: 'Safety checklist validation'
                      }
                    ]
                  }
                ]
              },
              {
                id: 'he-ev-nutrition',
                name: 'Nutrition',
                type: 'category',
                icon: '📂',
                description: 'Nutrition science and protocols',
                metrics: { success: 0.90, queries: 1100 },
                constraints: [
                  { id: 'nut1', text: 'Evidence-based nutritional guidance only', category: 'data_sources' },
                  { id: 'nut2', text: 'Avoid diet tribalism or extreme positions', category: 'tone' },
                  { id: 'nut3', text: 'Consider individual variation and context', category: 'output_format' }
                ],
                children: [
                  {
                    id: 'he-ev-nu-macro',
                    name: 'Macronutrient Research',
                    type: 'subintent',
                    icon: '🔧',
                    description: 'Analyze macronutrient research',
                    metrics: { success: 0.92, coverage: 0.90, queries: 600 },
                    constraints: [
                      { id: 'mac1', text: 'Population-specific recommendations', category: 'output_format' },
                      { id: 'mac2', text: 'Include context for goals (performance, health, body comp)', category: 'scope_boundaries' },
                      { id: 'mac3', text: 'Acknowledge individual variation', category: 'tone' }
                    ]
                  }
                ]
              },
              {
                id: 'he-ev-sleep',
                name: 'Sleep',
                type: 'category',
                icon: '📂',
                description: 'Sleep science and optimization',
                metrics: { success: 0.88, queries: 900 },
                constraints: [
                  { id: 'slp1', text: 'Focus on sleep architecture and circadian biology', category: 'scope_boundaries' },
                  { id: 'slp2', text: 'Practical implementation strategies required', category: 'output_format' },
                  { id: 'slp3', text: 'Address individual chronotype differences', category: 'tone' }
                ]
              }
            ]
          },
          {
            id: 'he-plan',
            name: 'Planning',
            type: 'intent',
            icon: '🎯',
            description: 'Habit change planning',
            metrics: { success: 0.86, queries: 2100 },
            constraints: [
              { id: 'plan1', text: 'Incremental, sustainable changes only', category: 'output_format' },
              { id: 'plan2', text: 'Behavioral science-based approaches', category: 'data_sources' },
              { id: 'plan3', text: 'Personalized to current fitness level', category: 'tone' },
              { id: 'plan4', text: 'Include specific, measurable goals', category: 'output_format' }
            ]
          },
          {
            id: 'he-task',
            name: 'Task Automation',
            type: 'intent',
            icon: '🎯',
            description: 'Automated reminders and tracking',
            metrics: { success: 0.94, queries: 1800 },
            constraints: [
              { id: 'task1', text: 'Simple, actionable reminders', category: 'output_format' },
              { id: 'task2', text: 'Respect user preferences and schedule', category: 'tone' },
              { id: 'task3', text: 'Avoid overwhelming frequency', category: 'scope_boundaries' }
            ]
          }
        ]
      },
      {
        id: 'beginner',
        name: 'Sedentary Beginner',
        type: 'cohort',
        icon: '👥',
        description: 'No regular health habits',
        metrics: { success: 0.85, users: 2100 },
        constraints: [
          { id: 'beg1', text: 'Simple, non-technical language', category: 'tone' },
          { id: 'beg2', text: 'Low barrier to entry for all recommendations', category: 'output_format' },
          { id: 'beg3', text: 'Focus on habit formation over optimization', category: 'scope_boundaries' },
          { id: 'beg4', text: 'Extra motivation and encouragement required', category: 'tone' },
          { id: 'beg5', text: 'Assume no prior health knowledge', category: 'assumptions' }
        ]
      },
      {
        id: 'optimizer',
        name: 'Optimizer',
        type: 'cohort',
        icon: '👥',
        description: 'Tracking metrics, experimenting',
        metrics: { success: 0.91, users: 800 },
        constraints: [
          { id: 'opt1', text: 'Data-driven approach expected', category: 'output_format' },
          { id: 'opt2', text: 'Advanced protocols and experimentation welcome', category: 'scope_boundaries' },
          { id: 'opt3', text: 'Quantified self mindset assumed', category: 'assumptions' },
          { id: 'opt4', text: 'Risk tolerance for experimental approaches', category: 'tone' },
          { id: 'opt5', text: 'Technical detail appreciated', category: 'tone' }
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
      description: 'User segments based on current habits and knowledge level. Defines baseline capabilities and appropriate complexity.',
      example: 'Example: "Health Enthusiast" - Regular exerciser with intermediate knowledge'
    },
    intent: {
      icon: '🎯',
      title: 'Intent Class',
      description: 'High-level user goals that cut across domains. Determines the type of interaction and expected outcome.',
      example: 'Example: "Evidence Research" - Seeking scientific backing for decisions'
    },
    category: {
      icon: '📂',
      title: 'Category',
      description: 'Domain-specific divisions. Each category has unique data sources and evaluation criteria.',
      example: 'Example: "Exercise" - Physical activity protocols and research'
    },
    subintent: {
      icon: '🔧',
      title: 'Sub-intent',
      description: 'Granular, specific handlers with precise constraints. Each has its own prompt and evaluation logic.',
      example: 'Example: "Meta-Analysis Review" - Synthesize multiple exercise studies'
    }
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return the agent hierarchy
    res.status(200).json(mockHierarchy);
  } else if (req.method === 'PUT') {
    // Update the agent hierarchy
    // In a real implementation, this would save to a database
    const updatedHierarchy = req.body;
    
    // Mock update
    mockHierarchy.updated_at = new Date().toISOString();
    
    res.status(200).json(mockHierarchy);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}