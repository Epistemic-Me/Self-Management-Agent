'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Download, Upload, Database, Link, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AgentHierarchy, AgentNode, LinkedFailureMode } from '@/types/agent-evaluation';

interface OpenCodingIntegrationProps {
  agentHierarchy: AgentHierarchy;
  onClose: () => void;
  onIntegrationComplete: () => void;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  query_count: number;
  execution_ids: string[];
  failure_modes: any[];
  created_at: string;
}

interface MappingRule {
  failure_mode_pattern: string;
  node_id: string;
  constraint_id?: string;
  confidence: number;
}

export function OpenCodingIntegration({ 
  agentHierarchy, 
  onClose, 
  onIntegrationComplete 
}: OpenCodingIntegrationProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationProgress, setIntegrationProgress] = useState(0);
  const [integrationResults, setIntegrationResults] = useState<any>(null);

  const generateMappingRules = useCallback(() => {
    // Generate intelligent mapping rules based on hierarchy structure
    const rules: MappingRule[] = [];
    
    // Traverse hierarchy and create mapping rules
    const traverse = (node: AgentNode) => {
      if (node.failureModes) {
        node.failureModes.forEach(fm => {
          rules.push({
            failure_mode_pattern: fm.name.toLowerCase(),
            node_id: node.id,
            constraint_id: fm.constraint_violated,
            confidence: 0.9
          });
        });
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(agentHierarchy.root_node);
    
    // Add common pattern mappings
    rules.push(
      {
        failure_mode_pattern: 'citation',
        node_id: 'he-evidence',
        confidence: 0.8
      },
      {
        failure_mode_pattern: 'tone',
        node_id: 'health-enthusiast',
        confidence: 0.7
      },
      {
        failure_mode_pattern: 'context',
        node_id: 'root',
        confidence: 0.6
      }
    );
    
    setMappingRules(rules);
  }, [agentHierarchy]);

  useEffect(() => {
    loadDatasets();
    generateMappingRules();
  }, [generateMappingRules]);

  const loadDatasets = async () => {
    try {
      // Mock data for now - replace with actual API call
      setDatasets([
        {
          id: 'dataset_1',
          name: 'Customer Support Evaluation',
          description: 'Dataset for testing customer support responses',
          query_count: 15,
          execution_ids: ['exec_123', 'exec_124'],
          failure_modes: [
            { id: 'fm1', label: 'Incomplete Response', count: 5 },
            { id: 'fm2', label: 'Inappropriate Tone', count: 3 },
            { id: 'fm3', label: 'Missing Context Awareness', count: 2 }
          ],
          created_at: '2024-01-15'
        },
        {
          id: 'dataset_2',
          name: 'Health Coach Evaluation',
          description: 'Health coaching conversation analysis',
          query_count: 22,
          execution_ids: ['exec_125', 'exec_126'],
          failure_modes: [
            { id: 'fm4', label: 'Hallucinated Citations', count: 8 },
            { id: 'fm5', label: 'Oversimplification', count: 4 },
            { id: 'fm6', label: 'Scope Creep', count: 6 }
          ],
          created_at: '2024-01-20'
        }
      ]);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleIntegration = async () => {
    if (!selectedDataset) return;
    
    setIsIntegrating(true);
    setIntegrationProgress(0);
    
    try {
      // Simulate integration process
      const steps = [
        'Loading failure modes from open coding...',
        'Applying mapping rules...',
        'Linking to hierarchy nodes...',
        'Updating constraint violations...',
        'Calculating impact metrics...',
        'Finalizing integration...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIntegrationProgress(((i + 1) / steps.length) * 100);
      }
      
      // Mock integration results
      setIntegrationResults({
        dataset_id: selectedDataset,
        linked_failure_modes: 12,
        updated_nodes: 5,
        new_constraint_violations: 8,
        confidence_score: 0.85
      });
      
    } catch (error) {
      console.error('Integration failed:', error);
    } finally {
      setIsIntegrating(false);
    }
  };

  const handleCompleteIntegration = () => {
    onIntegrationComplete();
  };

  const selectedDatasetData = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Open Coding Integration</h2>
            <p className="text-sm text-slate-400">
              Link failure modes from open coding analysis to agent hierarchy
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-8 h-8 p-0 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!integrationResults ? (
          <div className="space-y-6">
            {/* Dataset Selection */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">
                Select Dataset
              </label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                  <SelectValue placeholder="Choose a dataset to integrate..." />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{dataset.name}</span>
                          <span className="text-xs text-slate-400 block">{dataset.description}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {dataset.failure_modes.length} modes
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dataset Preview */}
            {selectedDatasetData && (
              <Card className="p-4 bg-slate-800/50 border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{selectedDatasetData.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {selectedDatasetData.query_count} queries
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {selectedDatasetData.execution_ids.length} executions
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 mb-4">{selectedDatasetData.description}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-300">Discovered Failure Modes:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDatasetData.failure_modes.map((fm) => (
                      <div key={fm.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                        <span className="text-sm text-slate-200">{fm.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {fm.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Mapping Rules Preview */}
            {selectedDataset && (
              <Card className="p-4 bg-slate-800/50 border-slate-600">
                <h3 className="font-semibold text-white mb-3">Mapping Rules</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Automatic rules for linking failure modes to hierarchy nodes
                </p>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mappingRules.slice(0, 8).map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm">
                      <span className="text-slate-300">
                        Pattern: <code className="bg-slate-600 px-1 rounded">{rule.failure_mode_pattern}</code>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">→ {rule.node_id}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            rule.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                            rule.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {Math.round(rule.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Integration Progress */}
            {isIntegrating && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-5 w-5 text-blue-400 animate-pulse" />
                  <span className="font-medium text-white">Integrating...</span>
                </div>
                <Progress value={integrationProgress} className="mb-2" />
                <p className="text-sm text-slate-400">
                  Processing failure modes and updating hierarchy constraints
                </p>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleIntegration}
                disabled={!selectedDataset || isIntegrating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isIntegrating ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Start Integration
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Integration Results */
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Integration Complete</h3>
              <p className="text-slate-400">
                Successfully linked open coding results to agent hierarchy
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{integrationResults.linked_failure_modes}</p>
                  <p className="text-sm text-slate-400">Failure Modes Linked</p>
                </div>
              </Card>
              
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{integrationResults.updated_nodes}</p>
                  <p className="text-sm text-slate-400">Nodes Updated</p>
                </div>
              </Card>
              
              <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{integrationResults.new_constraint_violations}</p>
                  <p className="text-sm text-slate-400">Constraint Violations</p>
                </div>
              </Card>
              
              <Card className="p-4 bg-orange-500/10 border-orange-500/30">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">
                    {Math.round(integrationResults.confidence_score * 100)}%
                  </p>
                  <p className="text-sm text-slate-400">Confidence Score</p>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-slate-800/50 border-slate-600">
              <h4 className="font-semibold text-white mb-3">What Happened</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Imported {integrationResults.linked_failure_modes} failure modes from dataset
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Applied mapping rules with {Math.round(integrationResults.confidence_score * 100)}% confidence
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Updated {integrationResults.updated_nodes} hierarchy nodes with new failure modes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Identified {integrationResults.new_constraint_violations} constraint violations
                </li>
              </ul>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Export integration report
                }}
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                onClick={handleCompleteIntegration}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View Updated Hierarchy
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}