'use client';

import React from 'react';
import { FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AgentNode } from '@/types/agent-evaluation';

interface PromptStructureProps {
  node: AgentNode;
  parentNodes: AgentNode[]; // Array of parent nodes for context
}

export function PromptStructure({ node, parentNodes }: PromptStructureProps) {
  // Only show for sub-intents
  if (node.type !== 'subintent') {
    return null;
  }

  // Extract context from parent nodes
  const getCohort = () => parentNodes.find(n => n.type === 'cohort')?.name || '{cohort}';
  const getIntentClass = () => parentNodes.find(n => n.type === 'intent')?.name || '{intent_class}';
  const getCategory = () => parentNodes.find(n => n.type === 'category')?.name || '{category}';
  
  // Group constraints by category
  const groupConstraintsByCategory = () => {
    const grouped: Record<string, string[]> = {};
    
    node.constraints?.forEach(constraint => {
      const category = constraint.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(constraint.text);
    });
    
    return grouped;
  };

  const constraintGroups = groupConstraintsByCategory();
  
  const generatePromptTemplate = () => {
    return `System_Prompt_Template:
  Role: "You are a ${getCategory()} evidence analyst for ${getCohort()} users"
  Context: "User is seeking ${getIntentClass()} specifically ${node.name}"
  
  Constraints:${Object.entries(constraintGroups).map(([category, constraints]) => 
    `\n    - ${category}: [${constraints.map(c => `"${c}"`).join(', ')}]`
  ).join('')}
  
  Examples:
    - {cohort_appropriate_examples}
    - {constraint_violation_examples}
  
  Routing_Fallback: "If query is outside scope, respond with:
    'This seems like a {detected_intent} question. Would you like 
    me to help with ${node.name} instead?'"`;
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(generatePromptTemplate());
  };

  return (
    <Card className="p-4 bg-slate-800/30 border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">Example Prompt Structure</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyTemplate}
          className="w-8 h-8 p-0 hover:bg-white/10"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <div className="text-slate-300">
          <div className="text-amber-300 mb-2">System_Prompt_Template:</div>
          
          <div className="ml-2 space-y-1">
            <div>
              <span className="text-blue-300">Role:</span> 
              <span className="text-green-300"> "You are a {getCategory()} evidence analyst for {getCohort()} users"</span>
            </div>
            <div>
              <span className="text-blue-300">Context:</span> 
              <span className="text-green-300"> "User is seeking {getIntentClass()} specifically {node.name}"</span>
            </div>
          </div>
          
          <div className="mt-4 mb-2">
            <span className="text-blue-300">Constraints:</span>
          </div>
          <div className="ml-2 space-y-1">
            {Object.entries(constraintGroups).map(([category, constraints]) => (
              <div key={category}>
                <span className="text-purple-300">- {category}:</span>
                <div className="ml-4 space-y-1">
                  {constraints.map((constraint, index) => (
                    <div key={index} className="text-slate-400">
                      - "{constraint}"
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 mb-2">
            <span className="text-blue-300">Examples:</span>
          </div>
          <div className="ml-2 space-y-1 text-slate-500">
            <div>- {`{${getCohort().toLowerCase().replace(/\s+/g, '_')}_appropriate_examples}`}</div>
            <div>- {`{constraint_violation_examples}`}</div>
          </div>
          
          <div className="mt-4 mb-2">
            <span className="text-blue-300">Routing_Fallback:</span> 
            <span className="text-green-300"> "If query is outside scope, respond with:</span>
          </div>
          <div className="ml-4 text-green-300">
            'This seems like a {`{detected_intent}`} question. Would you like<br />
            me to help with {node.name} instead?'"
          </div>
        </div>
      </div>
      
      {/* Template explanation */}
      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300 mb-1 font-medium">Template Context:</p>
        <div className="text-xs text-slate-400 space-y-1">
          <div><strong>Cohort:</strong> {getCohort()}</div>
          <div><strong>Intent:</strong> {getIntentClass()}</div>
          <div><strong>Category:</strong> {getCategory()}</div>
          <div><strong>Sub-intent:</strong> {node.name}</div>
        </div>
      </div>
    </Card>
  );
}