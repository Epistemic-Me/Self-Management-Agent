'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import type { AgentNode, ConstraintFailureMode } from '@/types/agent-evaluation';

interface EvaluationMetricsProps {
  node: AgentNode;
  onRefresh?: () => void;
}

interface MetricDisplayProps {
  label: string;
  value: number;
  format: 'percentage' | 'number';
  status?: 'success' | 'warning' | 'danger';
}

function MetricDisplay({ label, value, format, status }: MetricDisplayProps) {
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  const getProgressColor = (status?: string): string => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const formatValue = (val: number, fmt: string): string => {
    if (fmt === 'percentage') {
      return `${Math.round(val * 100)}%`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-3">
        {format === 'percentage' && (
          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getProgressColor(status)}`}
              style={{ width: `${Math.min(value * 100, 100)}%` }}
            />
          </div>
        )}
        <span className={`text-sm font-semibold min-w-12 text-right ${getStatusColor(status)}`}>
          {formatValue(value, format)}
        </span>
      </div>
    </div>
  );
}

function FailureModeDisplay({ failureMode }: { failureMode: ConstraintFailureMode }) {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-white">{failureMode.name}</h4>
        <Badge className={`${getSeverityColor(failureMode.severity)} text-xs`}>
          {failureMode.severity.toUpperCase()}
        </Badge>
      </div>
      
      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
        {failureMode.description}
      </p>
      
      {failureMode.mitigation && (
        <div className="text-xs text-slate-500">
          <span className="font-medium">Mitigation:</span> {failureMode.mitigation}
        </div>
      )}
      
      {failureMode.traces && failureMode.traces.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="bg-slate-600/20 text-slate-400 text-xs">
            {failureMode.traces.length} occurrences
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 hover:bg-white/10"
            onClick={() => {
              // TODO: Navigate to traces
              console.log('View traces:', failureMode.traces);
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function EvaluationMetrics({ node, onRefresh }: EvaluationMetricsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState(node.metrics || {});
  const [failureModes, setFailureModes] = useState(node.failureModes || []);

  useEffect(() => {
    setMetrics(node.metrics || {});
    setFailureModes(node.failureModes || []);
  }, [node]);

  const handleRefreshMetrics = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch latest metrics from API
      const response = await fetch(`/api/agent-evaluation/metrics/${node.id}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setFailureModes(data.failureModes || []);
        
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricStatus = (value: number): 'success' | 'warning' | 'danger' => {
    if (value >= 0.9) return 'success';
    if (value >= 0.8) return 'warning';
    return 'danger';
  };

  const primaryMetrics = [
    { key: 'success', label: 'Success Rate', format: 'percentage' as const },
    { key: 'coverage', label: 'Coverage', format: 'percentage' as const },
    { key: 'users', label: 'Users', format: 'number' as const },
    { key: 'queries', label: 'Queries', format: 'number' as const }
  ].filter(metric => metrics[metric.key] !== undefined);

  const additionalMetrics = Object.entries(node.evaluationMetrics || {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Evaluation Metrics</h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshMetrics}
          disabled={isLoading}
          className="w-8 h-8 p-0 hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Primary Metrics */}
      {primaryMetrics.length > 0 && (
        <Card className="p-4 bg-white/5 border-white/10">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Primary Metrics</h4>
          <div className="space-y-1">
            {primaryMetrics.map(({ key, label, format }) => (
              <MetricDisplay
                key={key}
                label={label}
                value={metrics[key] as number}
                format={format}
                status={format === 'percentage' ? getMetricStatus(metrics[key] as number) : undefined}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Additional Evaluation Metrics */}
      {additionalMetrics.length > 0 && (
        <Card className="p-4 bg-white/5 border-white/10">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Detailed Metrics</h4>
          <div className="space-y-1">
            {additionalMetrics.map(([key, value]) => (
              <MetricDisplay
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').trim()}
                value={value}
                format="percentage"
                status={getMetricStatus(value)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Failure Modes */}
      {failureModes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <h4 className="text-sm font-medium text-slate-300">Failure Modes</h4>
            <Badge 
              variant="secondary" 
              className="bg-orange-500/20 text-orange-400 border-orange-500/30"
            >
              {failureModes.length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {failureModes.map((failureMode) => (
              <FailureModeDisplay 
                key={failureMode.id} 
                failureMode={failureMode} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Integration Links */}
      <Card className="p-4 bg-white/5 border-white/10">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Related Data</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            onClick={() => {
              // TODO: Navigate to open coding results
              console.log('View open coding results for', node.id);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Open Coding Results
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            onClick={() => {
              // TODO: Navigate to evaluation history
              console.log('View evaluation history for', node.id);
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Evaluation History
          </Button>
        </div>
      </Card>

      {/* No Data State */}
      {primaryMetrics.length === 0 && additionalMetrics.length === 0 && failureModes.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 text-sm mb-4">No evaluation data available</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Run evaluation
              console.log('Run evaluation for', node.id);
            }}
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Run Evaluation
          </Button>
        </div>
      )}
    </div>
  );
}