'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  ExternalLink,
  RefreshCw,
  Database,
  Zap,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description: string;
  status: 'complete' | 'in_progress' | 'pending' | 'error';
  lastUpdated?: string;
  recordCount?: number;
  freshness: 'fresh' | 'recent' | 'stale';
  quality: number; // 0-100
  coverage: number; // 0-100
  actionUrl?: string;
  dependencies?: string[];
}

interface ContextRequirement {
  contextId: string;
  contextName: string;
  requiredSources: string[];
  helpfulSources: string[];
  optionalSources: string[];
}

interface DataAvailabilityMatrixProps {
  onRefresh?: () => void;
  onNavigateToSource?: (sourceId: string) => void;
}

const DATA_SOURCES: DataSource[] = [
  {
    id: 'user_profile',
    name: 'User Profile',
    description: 'Basic user information and preferences',
    status: 'complete',
    lastUpdated: '2024-11-10T10:00:00Z',
    recordCount: 1,
    freshness: 'fresh',
    quality: 95,
    coverage: 100,
    actionUrl: '/profile'
  },
  {
    id: 'beliefs',
    name: 'Health Beliefs',
    description: 'User health beliefs and confidence levels',
    status: 'complete',
    lastUpdated: '2024-11-10T08:30:00Z',
    recordCount: 12,
    freshness: 'recent',
    quality: 88,
    coverage: 85,
    actionUrl: '/beliefs'
  },
  {
    id: 'measurements',
    name: 'Manual Measurements',
    description: 'User-entered health measurements',
    status: 'complete',
    lastUpdated: '2024-11-09T20:15:00Z',
    recordCount: 45,
    freshness: 'recent',
    quality: 82,
    coverage: 70,
    actionUrl: '/measurements'
  },
  {
    id: 'biomarkers',
    name: 'Lab Biomarkers',
    description: 'Laboratory test results and biomarkers',
    status: 'pending',
    lastUpdated: '2024-11-01T14:20:00Z',
    recordCount: 8,
    freshness: 'stale',
    quality: 65,
    coverage: 40,
    actionUrl: '/lab-results',
    dependencies: ['dd_sync']
  },
  {
    id: 'dd_scores',
    name: 'Don\'t Die Scores',
    description: 'Daily health optimization scores',
    status: 'complete',
    lastUpdated: '2024-11-10T09:45:00Z',
    recordCount: 30,
    freshness: 'fresh',
    quality: 92,
    coverage: 95,
    dependencies: ['dd_sync']
  },
  {
    id: 'protocols',
    name: 'Active Protocols',
    description: 'Current health optimization protocols',
    status: 'in_progress',
    lastUpdated: '2024-11-10T07:00:00Z',
    recordCount: 3,
    freshness: 'fresh',
    quality: 78,
    coverage: 60,
    actionUrl: '/protocols',
    dependencies: ['dd_sync']
  },
  {
    id: 'capabilities',
    name: 'Physical Capabilities',
    description: 'Fitness and cognitive capability assessments',
    status: 'complete',
    lastUpdated: '2024-11-08T16:30:00Z',
    recordCount: 15,
    freshness: 'recent',
    quality: 85,
    coverage: 80,
    dependencies: ['dd_sync']
  },
  {
    id: 'checklist_status',
    name: 'Data Completeness',
    description: 'Checklist of required data collection items',
    status: 'complete',
    lastUpdated: '2024-11-10T10:00:00Z',
    recordCount: 7,
    freshness: 'fresh',
    quality: 100,
    coverage: 90
  },
  {
    id: 'dd_sync',
    name: 'Don\'t Die Sync',
    description: 'Integration with Don\'t Die platform',
    status: 'error',
    lastUpdated: '2024-11-10T06:00:00Z',
    recordCount: 0,
    freshness: 'stale',
    quality: 0,
    coverage: 0,
    actionUrl: '/integrations/dontdie'
  }
];

const CONTEXT_REQUIREMENTS: ContextRequirement[] = [
  {
    contextId: 'evidence_gathering',
    contextName: 'Evidence Gathering',
    requiredSources: ['beliefs', 'biomarkers', 'measurements'],
    helpfulSources: ['dd_scores', 'capabilities', 'checklist_status'],
    optionalSources: ['protocols']
  },
  {
    contextId: 'protocol_recommendation',
    contextName: 'Protocol Recommendation',
    requiredSources: ['checklist_status', 'measurements', 'protocols'],
    helpfulSources: ['beliefs', 'capabilities'],
    optionalSources: ['biomarkers', 'dd_scores']
  },
  {
    contextId: 'progress_tracking',
    contextName: 'Progress Tracking',
    requiredSources: ['measurements', 'dd_scores', 'protocols'],
    helpfulSources: ['capabilities', 'checklist_status'],
    optionalSources: ['beliefs', 'biomarkers']
  },
  {
    contextId: 'belief_revision',
    contextName: 'Belief Revision',
    requiredSources: ['beliefs'],
    helpfulSources: ['dd_scores', 'measurements', 'protocols'],
    optionalSources: ['biomarkers', 'capabilities']
  }
];

export default function DataAvailabilityMatrix({ 
  onRefresh, 
  onNavigateToSource 
}: DataAvailabilityMatrixProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertCircle;
      case 'error': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'in_progress': return 'text-yellow-500';
      case 'pending': return 'text-gray-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'fresh': return 'bg-green-500';
      case 'recent': return 'bg-yellow-500';
      case 'stale': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getFreshnessLabel = (freshness: string) => {
    switch (freshness) {
      case 'fresh': return '< 1 hour';
      case 'recent': return '< 24 hours';
      case 'stale': return '> 24 hours';
      default: return 'Unknown';
    }
  };

  const getContextReadiness = (contextId: string) => {
    const context = CONTEXT_REQUIREMENTS.find(c => c.contextId === contextId);
    if (!context) return { score: 0, issues: [] };

    const issues: string[] = [];
    let score = 0;
    let totalWeight = 0;

    // Check required sources (weight: 3)
    context.requiredSources.forEach(sourceId => {
      const source = DATA_SOURCES.find(s => s.id === sourceId);
      if (source) {
        totalWeight += 3;
        if (source.status === 'complete') {
          score += 3;
        } else {
          issues.push(`Required: ${source.name} is ${source.status}`);
        }
      }
    });

    // Check helpful sources (weight: 2)
    context.helpfulSources.forEach(sourceId => {
      const source = DATA_SOURCES.find(s => s.id === sourceId);
      if (source) {
        totalWeight += 2;
        if (source.status === 'complete') {
          score += 2;
        } else if (source.status === 'in_progress') {
          score += 1;
          issues.push(`Helpful: ${source.name} is in progress`);
        } else {
          issues.push(`Helpful: ${source.name} is ${source.status}`);
        }
      }
    });

    // Check optional sources (weight: 1)
    context.optionalSources.forEach(sourceId => {
      const source = DATA_SOURCES.find(s => s.id === sourceId);
      if (source) {
        totalWeight += 1;
        if (source.status === 'complete') {
          score += 1;
        }
      }
    });

    return {
      score: totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0,
      issues
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSourceRequirementLevel = (sourceId: string, contextId: string) => {
    const context = CONTEXT_REQUIREMENTS.find(c => c.contextId === contextId);
    if (!context) return null;

    if (context.requiredSources.includes(sourceId)) return 'required';
    if (context.helpfulSources.includes(sourceId)) return 'helpful';
    if (context.optionalSources.includes(sourceId)) return 'optional';
    return null;
  };

  const getRequirementColor = (level: string | null) => {
    switch (level) {
      case 'required': return 'bg-red-100 border-red-200';
      case 'helpful': return 'bg-yellow-100 border-yellow-200';
      case 'optional': return 'bg-gray-100 border-gray-200';
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Availability Matrix
                </CardTitle>
                <CardDescription>
                  Monitor data completeness across personalization contexts
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Context Readiness Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CONTEXT_REQUIREMENTS.map(context => {
                  const readiness = getContextReadiness(context.contextId);
                  return (
                    <Card 
                      key={context.contextId}
                      className={`cursor-pointer transition-colors ${
                        selectedContext === context.contextId 
                          ? 'ring-2 ring-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedContext(
                        selectedContext === context.contextId ? null : context.contextId
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">{context.contextName}</h3>
                            <Badge 
                              variant={readiness.score >= 80 ? 'default' : readiness.score >= 60 ? 'secondary' : 'destructive'}
                            >
                              {readiness.score}%
                            </Badge>
                          </div>
                          <Progress value={readiness.score} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {readiness.issues.length === 0 
                              ? 'All systems ready' 
                              : `${readiness.issues.length} issue${readiness.issues.length > 1 ? 's' : ''}`
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Data Sources Matrix */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 divide-y">
                  {/* Header */}
                  <div className="bg-muted/50 p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 font-medium text-sm">Data Source</div>
                      <div className="col-span-2 text-center font-medium text-sm">Status</div>
                      <div className="col-span-2 text-center font-medium text-sm">Quality</div>
                      <div className="col-span-2 text-center font-medium text-sm">Freshness</div>
                      <div className="col-span-2 text-center font-medium text-sm">Actions</div>
                    </div>
                  </div>

                  {/* Data Sources */}
                  {DATA_SOURCES.map(source => {
                    const StatusIcon = getStatusIcon(source.status);
                    const requirementLevel = selectedContext 
                      ? getSourceRequirementLevel(source.id, selectedContext)
                      : null;
                    
                    return (
                      <div 
                        key={source.id} 
                        className={`p-4 ${selectedContext ? getRequirementColor(requirementLevel) : ''}`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Source Info */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(source.status)}`} />
                              <div>
                                <div className="font-medium text-sm">{source.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {source.description}
                                </div>
                                {source.recordCount !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {source.recordCount} record{source.recordCount !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="col-span-2 text-center">
                            <Badge variant={source.status === 'complete' ? 'default' : 'secondary'}>
                              {source.status}
                            </Badge>
                            {selectedContext && requirementLevel && (
                              <div className="mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    requirementLevel === 'required' ? 'border-red-300 text-red-600' :
                                    requirementLevel === 'helpful' ? 'border-yellow-300 text-yellow-600' :
                                    'border-gray-300 text-gray-600'
                                  }`}
                                >
                                  {requirementLevel}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Quality */}
                          <div className="col-span-2 text-center">
                            <div className="space-y-1" title="Data quality score based on completeness and accuracy">
                              <div className="text-sm font-medium">{source.quality}%</div>
                              <Progress value={source.quality} className="h-1 w-16 mx-auto" />
                            </div>
                          </div>

                          {/* Freshness */}
                          <div className="col-span-2 text-center">
                            <div 
                              className="flex items-center justify-center gap-2"
                              title={`Last updated: ${source.lastUpdated ? new Date(source.lastUpdated).toLocaleString() : 'Unknown'}`}
                            >
                              <div 
                                className={`w-2 h-2 rounded-full ${getFreshnessColor(source.freshness)}`}
                              />
                              <span className="text-xs">{getFreshnessLabel(source.freshness)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 text-center">
                            {source.actionUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigateToSource?.(source.id)}
                                className="h-8"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span className="text-xs">Manage</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Dependencies */}
                        {source.dependencies && source.dependencies.length > 0 && (
                          <div className="mt-2 pl-7">
                            <div className="text-xs text-muted-foreground">
                              Depends on: {source.dependencies.map(dep => {
                                const depSource = DATA_SOURCES.find(s => s.id === dep);
                                const DepIcon = depSource ? getStatusIcon(depSource.status) : AlertCircle;
                                return (
                                  <span key={dep} className="inline-flex items-center gap-1 mr-2">
                                    <DepIcon className={`h-3 w-3 ${depSource ? getStatusColor(depSource.status) : 'text-gray-400'}`} />
                                    {depSource?.name || dep}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Fresh (&lt; 1 hour)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Recent (&lt; 24 hours)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Stale (&gt; 24 hours)</span>
                </div>
                {selectedContext && (
                  <>
                    <div className="border-l pl-4 ml-4">
                      <span className="font-medium">Context Requirements:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
                      <span>Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded" />
                      <span>Helpful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded" />
                      <span>Optional</span>
                    </div>
                  </>
                )}
              </div>

              {selectedContext && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">
                        {CONTEXT_REQUIREMENTS.find(c => c.contextId === selectedContext)?.contextName} Issues
                      </h3>
                      {(() => {
                        const readiness = getContextReadiness(selectedContext);
                        return readiness.issues.length > 0 ? (
                          <ul className="space-y-1">
                            {readiness.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            All data sources are ready for this context
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}