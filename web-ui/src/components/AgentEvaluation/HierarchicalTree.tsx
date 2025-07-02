'use client';

import React, { useState } from 'react';
import { ChevronRight, Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AgentNode, NodeType, TierInfo } from '@/types/agent-evaluation';

interface HierarchicalTreeProps {
  rootNode: AgentNode;
  selectedNode: AgentNode | null;
  onNodeSelect: (node: AgentNode) => void;
  isEditing?: boolean;
  tierInfo: Record<NodeType, TierInfo>;
}

interface TreeNodeProps {
  node: AgentNode;
  level: number;
  isLastChild: boolean;
  selectedNode: AgentNode | null;
  onNodeSelect: (node: AgentNode) => void;
  isEditing?: boolean;
  tierInfo: Record<NodeType, TierInfo>;
}

function TreeNode({
  node,
  level,
  isLastChild,
  selectedNode,
  onNodeSelect,
  isEditing,
  tierInfo
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.id === node.id;

  const getMetricStatus = (value: number): string => {
    if (value >= 0.9) return 'success';
    if (value >= 0.8) return 'warning';
    return 'danger';
  };

  const getMetricColor = (status: string): string => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getTierLabelClass = (nodeType: string): string => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full border';
    
    switch (nodeType) {
      case 'root':
        return `${baseClasses} bg-purple-500/20 text-purple-300 border-purple-500/30`;
      case 'cohort':
        return `${baseClasses} bg-blue-500/20 text-blue-300 border-blue-500/30`;
      case 'intent':
        return `${baseClasses} bg-green-500/20 text-green-300 border-green-500/30`;
      case 'category':
        return `${baseClasses} bg-orange-500/20 text-orange-300 border-orange-500/30`;
      case 'subintent':
        return `${baseClasses} bg-cyan-500/20 text-cyan-300 border-cyan-500/30`;
      default:
        return `${baseClasses} bg-slate-500/20 text-slate-300 border-slate-500/30`;
    }
  };

  return (
    <div className="relative">
      {/* Tree line */}
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 w-5 h-full"
          style={{ left: `${(level - 1) * 40}px` }}
        >
          <div className="absolute left-0 top-5 w-5 h-px bg-white/20" />
          {!isLastChild && (
            <div className="absolute left-0 top-5 bottom-0 w-px bg-white/20" />
          )}
        </div>
      )}

      {/* Node wrapper */}
      <div 
        className="relative flex items-start"
        style={{ paddingLeft: `${level * 40}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 p-0 mr-2 hover:bg-white/10"
          >
            <ChevronRight 
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        )}
        {!hasChildren && <div className="w-8" />}

        {/* Node card */}
        <div
          onClick={() => onNodeSelect(node)}
          className={`
            flex-1 p-4 rounded-lg border cursor-pointer transition-all
            ${isSelected 
              ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white flex items-center gap-2">
                {node.name}
                
                {/* Tier label and info */}
                {tierInfo[node.type] && (
                  <div className="flex items-center gap-1">
                    {/* Tier label badge */}
                    <span className={getTierLabelClass(node.type)}>
                      {tierInfo[node.type].title}
                    </span>
                    
                    {/* Info tooltip (only for non-root) */}
                    {node.type !== 'root' && (
                  <div className="relative group">
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center cursor-help">
                      <Info className="h-3 w-3 text-slate-400" />
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{tierInfo[node.type].icon}</span>
                        <h4 className="font-semibold text-white text-sm">
                          {tierInfo[node.type].title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        {tierInfo[node.type].description}
                      </p>
                      <p className="text-xs text-slate-400 italic">
                        {tierInfo[node.type].example}
                      </p>
                      
                      {/* Tooltip arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-600 rotate-45" />
                    </div>
                  </div>
                    )}
                  </div>
                )}
              </h3>
              
              {/* Edit buttons */}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Add node functionality
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Delete node functionality
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Node badge */}
            {node.metrics && (
              <Badge 
                variant="secondary" 
                className="bg-white/10 text-slate-300 border-0 text-xs"
              >
                {node.metrics.users 
                  ? `${node.metrics.users.toLocaleString()} users`
                  : node.metrics.queries 
                  ? `${node.metrics.queries.toLocaleString()} queries`
                  : null
                }
              </Badge>
            )}
          </div>

          {/* Description */}
          {node.description && (
            <p className="text-sm text-slate-400 mb-3">{node.description}</p>
          )}

          {/* Metrics */}
          {node.metrics && (node.metrics.success !== undefined || node.metrics.coverage !== undefined) && (
            <div className="flex items-center gap-4">
              {node.metrics.success !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Success:</span>
                  <span className={`text-sm font-semibold ${getMetricColor(getMetricStatus(node.metrics.success))}`}>
                    {Math.round(node.metrics.success * 100)}%
                  </span>
                </div>
              )}
              
              {node.metrics.coverage !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Coverage:</span>
                  <span className={`text-sm font-semibold ${getMetricColor(getMetricStatus(node.metrics.coverage))}`}>
                    {Math.round(node.metrics.coverage * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {node.constraints && node.constraints.length > 0 && (
              <span>{node.constraints.length} constraints</span>
            )}
            {node.failureModes && node.failureModes.length > 0 && (
              <span className="text-orange-400">{node.failureModes.length} failure modes</span>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {node.children!.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLastChild={index === node.children!.length - 1}
              selectedNode={selectedNode}
              onNodeSelect={onNodeSelect}
              isEditing={isEditing}
              tierInfo={tierInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchicalTree({
  rootNode,
  selectedNode,
  onNodeSelect,
  isEditing,
  tierInfo
}: HierarchicalTreeProps) {
  return (
    <div className="space-y-2 pr-4 overflow-y-auto max-h-[calc(100vh-300px)]">
      <TreeNode
        node={rootNode}
        level={0}
        isLastChild={true}
        selectedNode={selectedNode}
        onNodeSelect={onNodeSelect}
        isEditing={isEditing}
        tierInfo={tierInfo}
      />
    </div>
  );
}