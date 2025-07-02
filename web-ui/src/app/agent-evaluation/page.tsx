'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Shield, 
  BarChart3, 
  TreePine,
  Settings,
  Download,
  Plus,
  Edit,
  ChevronRight
} from 'lucide-react';
import { HierarchicalTree } from '@/components/AgentEvaluation/HierarchicalTree';
import { ConstraintManager } from '@/components/AgentEvaluation/ConstraintManager';
import { EvaluationMetrics } from '@/components/AgentEvaluation/EvaluationMetrics';
import { OpenCodingIntegration } from '@/components/AgentEvaluation/OpenCodingIntegration';
import { PromptStructure } from '@/components/AgentEvaluation/PromptStructure';
import type { AgentNode, AgentHierarchy } from '@/types/agent-evaluation';
import { DEFAULT_TIER_INFO } from '@/types/agent-evaluation';

// Default agent structure (from prototype)
const defaultAgentStructure: AgentNode = {
  id: 'root',
  name: 'AI Health Coach',
  type: 'root',
  icon: '🏥',
  metrics: { success: 0.92, coverage: 0.85 },
  children: [
    {
      id: 'health-enthusiast',
      name: 'Health Enthusiast',
      type: 'cohort',
      icon: '👥',
      description: 'Regular exercise, decent sleep patterns',
      metrics: { success: 0.89, users: 1250 },
      constraints: [
        { id: 'c1', text: 'Regular activity baseline' },
        { id: 'c2', text: 'Intermediate knowledge' },
        { id: 'c3', text: 'Goal-oriented mindset' }
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
            { id: 'c4', text: 'Peer-reviewed sources only' },
            { id: 'c5', text: 'Statistical literacy assumed' },
            { id: 'c6', text: 'Academic tone preferred' }
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
        { id: 'c7', text: 'Simple language' },
        { id: 'c8', text: 'Low barrier to entry' },
        { id: 'c9', text: 'Focus on habit formation' }
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
        { id: 'c10', text: 'Data-driven approach' },
        { id: 'c11', text: 'Advanced protocols' },
        { id: 'c12', text: 'Quantified self mindset' }
      ]
    }
  ]
};

export default function AgentEvaluationPage() {
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [selectedNodeParents, setSelectedNodeParents] = useState<AgentNode[]>([]);
  const [agentHierarchy, setAgentHierarchy] = useState<AgentHierarchy>({
    id: 'default',
    name: 'Default Health Coach Agent',
    description: 'Hierarchical constraint-based evaluation system',
    root_node: defaultAgentStructure,
    tier_info: DEFAULT_TIER_INFO,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);

  // Load agent hierarchy from API
  useEffect(() => {
    loadAgentHierarchy();
  }, []);

  const loadAgentHierarchy = async () => {
    try {
      const response = await fetch('/api/agent-evaluation/hierarchy');
      if (response.ok) {
        const data = await response.json();
        setAgentHierarchy(data);
      }
    } catch (error) {
      console.error('Failed to load agent hierarchy:', error);
      // Use default structure as fallback
    }
  };

  // Helper function to find the path to a node (including all parent nodes)
  const findNodePath = (targetNode: AgentNode, currentNode: AgentNode, currentPath: AgentNode[] = []): AgentNode[] | null => {
    const newPath = [...currentPath, currentNode];
    
    if (currentNode.id === targetNode.id) {
      return newPath;
    }
    
    if (currentNode.children) {
      for (const child of currentNode.children) {
        const result = findNodePath(targetNode, child, newPath);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  };

  const handleNodeSelect = (node: AgentNode) => {
    console.log('Selected node:', node.name, 'Constraints:', node.constraints?.length || 0);
    
    // Find the path to this node to get parent context
    const path = findNodePath(node, agentHierarchy.root_node);
    const parents = path ? path.slice(0, -1) : []; // Exclude the selected node itself
    
    setSelectedNode(node);
    setSelectedNodeParents(parents);
  };

  const handleConstraintUpdate = async (nodeId: string, constraints: any[]) => {
    try {
      const response = await fetch(`/api/agent-evaluation/constraints/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints })
      });
      
      if (response.ok) {
        // Reload hierarchy to reflect changes
        await loadAgentHierarchy();
      }
    } catch (error) {
      console.error('Failed to update constraints:', error);
    }
  };

  const handleExportHierarchy = () => {
    const dataStr = JSON.stringify(agentHierarchy, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `agent-hierarchy-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Evaluation</h1>
              <p className="text-sm text-slate-400">
                Hierarchical constraint architecture for systematic evaluation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIntegration(!showIntegration)}
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Open Coding Integration
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHierarchy}
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Nodes</p>
                <p className="text-2xl font-bold text-white">
                  {countNodes(agentHierarchy.root_node)}
                </p>
              </div>
              <TreePine className="h-8 w-8 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Constraints</p>
                <p className="text-2xl font-bold text-white">
                  {countConstraints(agentHierarchy.root_node)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Failure Modes</p>
                <p className="text-2xl font-bold text-white">
                  {countFailureModes(agentHierarchy.root_node)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Success</p>
                <p className="text-2xl font-bold text-white">
                  {calculateAvgSuccess(agentHierarchy.root_node)}%
                </p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Target className="h-4 w-4" />
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6">
        {/* Tree Panel */}
        <div className="flex-1">
          <Card className="h-full bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TreePine className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Evaluation Hierarchy</h2>
            </div>
            
            <HierarchicalTree
              rootNode={agentHierarchy.root_node}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              isEditing={isEditing}
              tierInfo={agentHierarchy.tier_info}
            />
          </Card>
        </div>

        {/* Details Panel */}
        <div className="w-[420px] space-y-4">
          {selectedNode ? (
            <>
              {/* Prompt Structure (only for sub-intents) */}
              {selectedNode.type === 'subintent' && (
                <PromptStructure
                  node={selectedNode}
                  parentNodes={selectedNodeParents}
                />
              )}

              {/* Constraint Manager */}
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                <ConstraintManager
                  node={selectedNode}
                  isEditing={isEditing}
                  onUpdate={(constraints) => handleConstraintUpdate(selectedNode.id, constraints)}
                />
              </Card>

              {/* Evaluation Metrics */}
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                <EvaluationMetrics
                  node={selectedNode}
                  onRefresh={() => loadAgentHierarchy()}
                />
              </Card>
            </>
          ) : (
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">Select a node to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Integration Modal */}
      {showIntegration && (
        <OpenCodingIntegration
          agentHierarchy={agentHierarchy}
          onClose={() => setShowIntegration(false)}
          onIntegrationComplete={() => {
            setShowIntegration(false);
            loadAgentHierarchy();
          }}
        />
      )}
    </div>
  );
}

// Helper functions
function countNodes(node: AgentNode): number {
  let count = 1;
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
}

function countConstraints(node: AgentNode): number {
  let count = node.constraints?.length || 0;
  if (node.children) {
    node.children.forEach(child => {
      count += countConstraints(child);
    });
  }
  return count;
}

function countFailureModes(node: AgentNode): number {
  let count = node.failureModes?.length || 0;
  if (node.children) {
    node.children.forEach(child => {
      count += countFailureModes(child);
    });
  }
  return count;
}

function calculateAvgSuccess(node: AgentNode): string {
  const successes: number[] = [];
  
  function collectSuccesses(n: AgentNode) {
    if (n.metrics?.success !== undefined) {
      successes.push(n.metrics.success);
    }
    if (n.children) {
      n.children.forEach(collectSuccesses);
    }
  }
  
  collectSuccesses(node);
  
  if (successes.length === 0) return '0';
  const avg = successes.reduce((a, b) => a + b, 0) / successes.length;
  return (avg * 100).toFixed(1);
}