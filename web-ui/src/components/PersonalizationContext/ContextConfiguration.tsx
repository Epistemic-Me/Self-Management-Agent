'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ContextRequirement {
  id: string;
  data_source: string;
  requirement_type: 'required' | 'helpful' | 'optional';
  priority: number;
  token_weight: number;
  max_items?: number;
  freshness_hours?: number;
  conditions?: any;
  is_active: boolean;
}

interface ContextConfigurationProps {
  contextType: string;
  contextName: string;
  onSave: (requirements: ContextRequirement[]) => void;
  onReset: () => void;
}

const DATA_SOURCES = [
  'user_profile',
  'beliefs',
  'measurements',
  'biomarkers',
  'dd_scores',
  'protocols',
  'capabilities',
  'checklist_status',
  'self_model',
  'dd_measurements',
  'protocol_templates'
];

const REQUIREMENT_TYPES = [
  { value: 'required', label: 'Required', color: 'bg-red-500' },
  { value: 'helpful', label: 'Helpful', color: 'bg-yellow-500' },
  { value: 'optional', label: 'Optional', color: 'bg-gray-400' }
];

export default function ContextConfiguration({ 
  contextType, 
  contextName, 
  onSave, 
  onReset 
}: ContextConfigurationProps) {
  const [requirements, setRequirements] = useState<ContextRequirement[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadDefaultRequirements = useCallback(() => {
    // Default requirements based on context type
    const defaults: Record<string, Partial<ContextRequirement>[]> = {
      evidence_gathering: [
        { data_source: 'beliefs', requirement_type: 'required', priority: 1, token_weight: 1.2 },
        { data_source: 'biomarkers', requirement_type: 'required', priority: 2, token_weight: 1.1 },
        { data_source: 'measurements', requirement_type: 'required', priority: 3, token_weight: 1.0 },
        { data_source: 'dd_scores', requirement_type: 'helpful', priority: 4, token_weight: 0.8 },
        { data_source: 'capabilities', requirement_type: 'helpful', priority: 5, token_weight: 0.7 },
        { data_source: 'checklist_status', requirement_type: 'helpful', priority: 6, token_weight: 0.6 }
      ],
      protocol_recommendation: [
        { data_source: 'checklist_status', requirement_type: 'required', priority: 1, token_weight: 1.3 },
        { data_source: 'protocols', requirement_type: 'required', priority: 2, token_weight: 1.2 },
        { data_source: 'measurements', requirement_type: 'required', priority: 3, token_weight: 1.0 },
        { data_source: 'capabilities', requirement_type: 'helpful', priority: 4, token_weight: 0.9 },
        { data_source: 'beliefs', requirement_type: 'helpful', priority: 5, token_weight: 0.8 },
        { data_source: 'protocol_templates', requirement_type: 'helpful', priority: 6, token_weight: 0.7 }
      ],
      progress_tracking: [
        { data_source: 'dd_measurements', requirement_type: 'required', priority: 1, token_weight: 1.2 },
        { data_source: 'measurements', requirement_type: 'required', priority: 2, token_weight: 1.1 },
        { data_source: 'dd_scores', requirement_type: 'required', priority: 3, token_weight: 1.0 },
        { data_source: 'protocols', requirement_type: 'helpful', priority: 4, token_weight: 0.8 },
        { data_source: 'capabilities', requirement_type: 'helpful', priority: 5, token_weight: 0.7 },
        { data_source: 'checklist_status', requirement_type: 'helpful', priority: 6, token_weight: 0.6 }
      ],
      belief_revision: [
        { data_source: 'beliefs', requirement_type: 'required', priority: 1, token_weight: 1.3 },
        { data_source: 'self_model', requirement_type: 'required', priority: 2, token_weight: 1.1 },
        { data_source: 'dd_scores', requirement_type: 'helpful', priority: 3, token_weight: 0.9 },
        { data_source: 'measurements', requirement_type: 'helpful', priority: 4, token_weight: 0.8 },
        { data_source: 'protocols', requirement_type: 'helpful', priority: 5, token_weight: 0.7 }
      ]
    };

    const contextDefaults = defaults[contextType] || [];
    const mappedRequirements: ContextRequirement[] = contextDefaults.map((req, index) => ({
      id: `req-${index}`,
      data_source: req.data_source!,
      requirement_type: req.requirement_type as 'required' | 'helpful' | 'optional',
      priority: req.priority!,
      token_weight: req.token_weight!,
      max_items: req.requirement_type === 'required' ? undefined : 10,
      freshness_hours: req.requirement_type === 'required' ? 24 : 72,
      is_active: true
    }));

    setRequirements(mappedRequirements);
    setIsModified(false);
  }, [contextType]);

  // Load default requirements based on context type
  useEffect(() => {
    loadDefaultRequirements();
  }, [contextType, loadDefaultRequirements]);

  const addRequirement = () => {
    const newRequirement: ContextRequirement = {
      id: `req-${Date.now()}`,
      data_source: DATA_SOURCES[0],
      requirement_type: 'optional',
      priority: requirements.length + 1,
      token_weight: 1.0,
      max_items: 10,
      freshness_hours: 72,
      is_active: true
    };

    setRequirements([...requirements, newRequirement]);
    setIsModified(true);
  };

  const updateRequirement = (id: string, updates: Partial<ContextRequirement>) => {
    setRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
    setIsModified(true);
  };

  const removeRequirement = (id: string) => {
    setRequirements(prev => prev.filter(req => req.id !== id));
    setIsModified(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate requirements
      const hasRequired = requirements.some(req => req.requirement_type === 'required' && req.is_active);
      if (!hasRequired) {
        setError('At least one required data source must be active');
        return;
      }

      // Sort by priority
      const sortedRequirements = [...requirements].sort((a, b) => a.priority - b.priority);
      
      await onSave(sortedRequirements);
      setIsModified(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadDefaultRequirements();
    onReset();
    setError(null);
    setSuccess(false);
  };

  const getRequirementTypeColor = (type: string) => {
    return REQUIREMENT_TYPES.find(t => t.value === type)?.color || 'bg-gray-400';
  };

  const moveRequirement = (id: string, direction: 'up' | 'down') => {
    const index = requirements.findIndex(req => req.id === id);
    if (index === -1) return;

    const newRequirements = [...requirements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= requirements.length) return;

    // Swap priorities
    const temp = newRequirements[index].priority;
    newRequirements[index].priority = newRequirements[targetIndex].priority;
    newRequirements[targetIndex].priority = temp;

    // Sort by priority
    newRequirements.sort((a, b) => a.priority - b.priority);
    
    setRequirements(newRequirements);
    setIsModified(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Context Configuration
            </CardTitle>
            <CardDescription>
              Configure data requirements for {contextName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isModified || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Configuration saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Data Source Requirements</h3>
            <Button variant="outline" size="sm" onClick={addRequirement}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>

          <div className="space-y-3">
            {requirements
              .sort((a, b) => a.priority - b.priority)
              .map((requirement, index) => (
                <Card key={requirement.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{requirement.priority}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => moveRequirement(requirement.id, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => moveRequirement(requirement.id, 'down')}
                              disabled={index === requirements.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                        
                        <Badge 
                          className={`${getRequirementTypeColor(requirement.requirement_type)} text-white`}
                        >
                          {requirement.requirement_type}
                        </Badge>
                        
                        <input
                          type="checkbox"
                          checked={requirement.is_active}
                          onChange={(e) => 
                            updateRequirement(requirement.id, { is_active: e.target.checked })
                          }
                          className="h-4 w-4 rounded border border-gray-300"
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(requirement.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data Source</label>
                        <Select
                          value={requirement.data_source}
                          onValueChange={(value) => 
                            updateRequirement(requirement.id, { data_source: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_SOURCES.map(source => (
                              <SelectItem key={source} value={source}>
                                {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Requirement Type</label>
                        <Select
                          value={requirement.requirement_type}
                          onValueChange={(value) => 
                            updateRequirement(requirement.id, { 
                              requirement_type: value as 'required' | 'helpful' | 'optional' 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUIREMENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Token Weight</label>
                        <div className="space-y-1">
                          <input
                            type="range"
                            value={requirement.token_weight}
                            onChange={(e) => 
                              updateRequirement(requirement.id, { token_weight: parseFloat(e.target.value) })
                            }
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-xs text-muted-foreground text-center">
                            {requirement.token_weight}x
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Items</label>
                        <Input
                          type="number"
                          value={requirement.max_items || ''}
                          onChange={(e) => 
                            updateRequirement(requirement.id, { 
                              max_items: e.target.value ? parseInt(e.target.value) : undefined 
                            })
                          }
                          placeholder="No limit"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Freshness (hours)</label>
                        <Input
                          type="number"
                          value={requirement.freshness_hours || ''}
                          onChange={(e) => 
                            updateRequirement(requirement.id, { 
                              freshness_hours: e.target.value ? parseInt(e.target.value) : undefined 
                            })
                          }
                          placeholder="No limit"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Conditions (JSON)</label>
                        <Textarea
                          value={requirement.conditions ? JSON.stringify(requirement.conditions) : ''}
                          onChange={(e) => {
                            try {
                              const conditions = e.target.value ? JSON.parse(e.target.value) : undefined;
                              updateRequirement(requirement.id, { conditions });
                            } catch {
                              // Invalid JSON, don't update
                            }
                          }}
                          placeholder='{"key": "value"}'
                          className="font-mono text-xs"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {requirements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requirements configured. Click "Add Source" to get started.</p>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Tips:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Required sources are always included when available</li>
              <li>Higher token weights prioritize sources when space is limited</li>
              <li>Freshness limits exclude stale data from contexts</li>
              <li>Max items controls how many records from each source to include</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}