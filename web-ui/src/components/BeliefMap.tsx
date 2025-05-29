'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Belief } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BeliefMapProps {
  beliefMap: {
    core: Belief[];
    related: Belief[];
  };
}

export function BeliefMap({ beliefMap }: BeliefMapProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderBeliefList = (beliefs: Belief[], title: string, key: string) => {
    const isExpanded = expandedSections.has(key);
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(key)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {title} ({beliefs.length})
        </button>
        
        {isExpanded && (
          <div className="mt-2 space-y-2">
            {beliefs.map((belief) => (
              <div key={belief.id} className="pl-5 border-l-2 border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Confidence: {Math.round(belief.confidence * 100)}%
                </div>
                <div className="text-sm">{belief.statement}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderBeliefList(beliefMap.core, 'Core Beliefs', 'core')}
      {renderBeliefList(beliefMap.related, 'Related Beliefs', 'related')}
      
      {beliefMap.core.length === 0 && beliefMap.related.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4">
          No beliefs identified yet
        </div>
      )}
    </div>
  );
} 