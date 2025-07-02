'use client';

import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { AgentNode, Constraint } from '@/types/agent-evaluation';

interface ConstraintManagerProps {
  node: AgentNode;
  isEditing?: boolean;
  onUpdate?: (constraints: Constraint[]) => void;
}

interface ConstraintEditorProps {
  constraint: Constraint;
  onSave: (constraint: Constraint) => void;
  onCancel: () => void;
}

function ConstraintEditor({ constraint, onSave, onCancel }: ConstraintEditorProps) {
  const [text, setText] = useState(constraint.text);
  const [category, setCategory] = useState(constraint.category || '');

  const handleSave = () => {
    onSave({
      ...constraint,
      text,
      category: category || undefined
    });
  };

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            Constraint Text
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter constraint description..."
            className="bg-slate-800/50 border-slate-600 text-slate-200 min-h-[60px]"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            Category (optional)
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., data_sources, output_format, scope_boundaries"
            className="bg-slate-800/50 border-slate-600 text-slate-200"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ConstraintManager({ node, isEditing, onUpdate }: ConstraintManagerProps) {
  const [constraints, setConstraints] = useState<Constraint[]>(node.constraints || []);
  const [editingConstraint, setEditingConstraint] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Update constraints when node changes
  React.useEffect(() => {
    setConstraints(node.constraints || []);
  }, [node.id, node.constraints]);

  const handleAddConstraint = () => {
    const newConstraint: Constraint = {
      id: `constraint_${Date.now()}`,
      text: '',
      category: ''
    };
    setIsAddingNew(true);
    setEditingConstraint(newConstraint.id);
    setConstraints([...constraints, newConstraint]);
  };

  const handleSaveConstraint = (updatedConstraint: Constraint) => {
    const updatedConstraints = constraints.map(c => 
      c.id === updatedConstraint.id ? updatedConstraint : c
    );
    setConstraints(updatedConstraints);
    setEditingConstraint(null);
    setIsAddingNew(false);
    
    if (onUpdate) {
      onUpdate(updatedConstraints);
    }
  };

  const handleDeleteConstraint = (constraintId: string) => {
    const updatedConstraints = constraints.filter(c => c.id !== constraintId);
    setConstraints(updatedConstraints);
    
    if (onUpdate) {
      onUpdate(updatedConstraints);
    }
  };

  const handleCancelEdit = (constraintId: string) => {
    setEditingConstraint(null);
    
    if (isAddingNew) {
      // Remove the constraint we were adding
      const updatedConstraints = constraints.filter(c => c.id !== constraintId);
      setConstraints(updatedConstraints);
      setIsAddingNew(false);
    }
  };

  const getCategoryColor = (category?: string): string => {
    if (!category) return 'bg-slate-500/20 text-slate-400';
    
    const colors: Record<string, string> = {
      'data_sources': 'bg-blue-500/20 text-blue-400',
      'output_format': 'bg-green-500/20 text-green-400',
      'scope_boundaries': 'bg-purple-500/20 text-purple-400',
      'tone': 'bg-orange-500/20 text-orange-400',
      'validation': 'bg-red-500/20 text-red-400'
    };

    return colors[category] || 'bg-cyan-500/20 text-cyan-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Constraints</h3>
          <Badge 
            variant="secondary" 
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            {constraints.length}
          </Badge>
          {/* Debug: Show current node */}
          <Badge 
            variant="outline" 
            className="border-white/20 text-slate-400 text-xs"
          >
            {node.name}
          </Badge>
        </div>
        
        {isEditing && (
          <Button
            size="sm"
            onClick={handleAddConstraint}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Constraint
          </Button>
        )}
      </div>

      {constraints.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 text-sm">No constraints defined</p>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddConstraint}
              className="mt-3 border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Constraint
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {constraints.map((constraint) => (
            <div key={constraint.id}>
              {editingConstraint === constraint.id ? (
                <ConstraintEditor
                  constraint={constraint}
                  onSave={handleSaveConstraint}
                  onCancel={() => handleCancelEdit(constraint.id)}
                />
              ) : (
                <div className="group p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {constraint.category && (
                          <Badge 
                            className={`${getCategoryColor(constraint.category)} border-0 text-xs`}
                          >
                            {constraint.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {constraint.text}
                      </p>
                    </div>

                    {isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingConstraint(constraint.id)}
                          className="w-8 h-8 p-0 hover:bg-white/10"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConstraint(constraint.id)}
                          className="w-8 h-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Constraint Templates (future enhancement) */}
      {isEditing && constraints.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-2">Quick Actions</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs"
              onClick={() => {
                // TODO: Import constraint templates
                console.log('Import templates for', node.type);
              }}
            >
              Import Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs"
              onClick={() => {
                // TODO: Validate constraints
                console.log('Validate constraints for', node.id);
              }}
            >
              Validate All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}