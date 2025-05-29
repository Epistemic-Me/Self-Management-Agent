'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Philosophy } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PhilosophyAccordionProps {
  philosophies: Philosophy[];
}

export function PhilosophyAccordion({ philosophies }: PhilosophyAccordionProps) {
  const [expandedPhilosophies, setExpandedPhilosophies] = useState<Set<string>>(new Set());

  const togglePhilosophy = (philosophyId: string) => {
    const newExpanded = new Set(expandedPhilosophies);
    if (newExpanded.has(philosophyId)) {
      newExpanded.delete(philosophyId);
    } else {
      newExpanded.add(philosophyId);
    }
    setExpandedPhilosophies(newExpanded);
  };

  if (philosophies.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No philosophies defined
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {philosophies.map((philosophy) => {
        const isExpanded = expandedPhilosophies.has(philosophy.belief_system_id);
        
        return (
          <div key={philosophy.belief_system_id} className="border border-border rounded-lg">
            <button
              onClick={() => togglePhilosophy(philosophy.belief_system_id)}
              className="w-full p-4 text-left hover:bg-accent transition-colors rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{philosophy.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {philosophy.root_count} root beliefs • {philosophy.sub_count} sub-beliefs
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border">
                <div className="pt-3 text-sm text-muted-foreground">
                  Detailed belief system would be loaded here from the API
                  <br />
                  (Philosophy ID: {philosophy.belief_system_id})
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 