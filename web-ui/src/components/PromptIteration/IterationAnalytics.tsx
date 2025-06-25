'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  Zap,
  Activity
} from 'lucide-react';

// Types
interface PromptVersion {
  id: string;
  content: string;
  timestamp: string;
  version: number;
  metrics?: {
    qualityScore: number;
    responseTime: number;
    successRate: number;
  };
}

interface ComparisonTrace {
  id: string;
  query: string;
  leftResponse: string;
  rightResponse: string;
  leftMetrics: {
    qualityScore: number;
    responseTime: number;
  };
  rightMetrics: {
    qualityScore: number;
    responseTime: number;
  };
}

interface IterationAnalyticsProps {
  promptVersions: PromptVersion[];
  comparisonTraces: ComparisonTrace[];
}

export function IterationAnalytics({ promptVersions, comparisonTraces }: IterationAnalyticsProps) {
  // Calculate trends
  const qualityTrend = promptVersions.map(v => v.metrics?.qualityScore || 0);
  const timeTrend = promptVersions.map(v => v.metrics?.responseTime || 0);
  const successTrend = promptVersions.map(v => v.metrics?.successRate || 0);

  // Calculate improvements
  const qualityImprovement = qualityTrend.length > 1 ? 
    qualityTrend[qualityTrend.length - 1] - qualityTrend[0] : 0;
  const timeImprovement = timeTrend.length > 1 ? 
    timeTrend[0] - timeTrend[timeTrend.length - 1] : 0; // Negative is better for time
  const successImprovement = successTrend.length > 1 ? 
    successTrend[successTrend.length - 1] - successTrend[0] : 0;

  // Calculate averages for comparison traces
  const avgQualityImprovement = comparisonTraces.length > 0 ?
    comparisonTraces.reduce((sum, trace) => 
      sum + (trace.rightMetrics.qualityScore - trace.leftMetrics.qualityScore), 0) / comparisonTraces.length : 0;
  
  const avgTimeImprovement = comparisonTraces.length > 0 ?
    comparisonTraces.reduce((sum, trace) => 
      sum + (trace.leftMetrics.responseTime - trace.rightMetrics.responseTime), 0) / comparisonTraces.length : 0;

  // Find best performing version
  const bestVersion = promptVersions.reduce((best, current) => 
    (current.metrics?.qualityScore || 0) > (best.metrics?.qualityScore || 0) ? current : best,
    promptVersions[0]
  );

  const getTrendIcon = (value: number, isTimeMetric = false) => {
    const isPositive = isTimeMetric ? value > 0 : value > 0; // For time, positive improvement is actually negative change
    if (Math.abs(value) < 0.1) return <Activity className="h-4 w-4 text-slate-400" />;
    return isPositive ? 
      <TrendingUp className="h-4 w-4 text-green-400" /> : 
      <TrendingDown className="h-4 w-4 text-red-400" />;
  };

  const getTrendColor = (value: number, isTimeMetric = false) => {
    const isPositive = isTimeMetric ? value > 0 : value > 0;
    if (Math.abs(value) < 0.1) return 'text-slate-400';
    return isPositive ? 'text-green-400' : 'text-red-400';
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, label, color = 'bg-blue-500' }: { 
    data: number[], 
    label: string, 
    color?: string 
  }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-300 font-medium">{label}</p>
        <div className="flex items-end space-x-1 h-20">
          {data.map((value, index) => {
            const height = ((value - minValue) / range) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center mb-1">
                  <div 
                    className={`w-3/4 ${color} rounded-sm transition-all duration-300`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">v{index + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{minValue.toFixed(0)}</span>
          <span>{maxValue.toFixed(0)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Quality Score</span>
            </div>
            {getTrendIcon(qualityImprovement)}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {promptVersions[promptVersions.length - 1]?.metrics?.qualityScore.toFixed(1) || '0.0'}%
              </span>
              <span className={`text-sm ${getTrendColor(qualityImprovement)}`}>
                {qualityImprovement > 0 ? '+' : ''}{qualityImprovement.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={promptVersions[promptVersions.length - 1]?.metrics?.qualityScore || 0} 
              className="h-2"
            />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-blue-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Response Time</span>
            </div>
            {getTrendIcon(timeImprovement, true)}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {promptVersions[promptVersions.length - 1]?.metrics?.responseTime || 0}ms
              </span>
              <span className={`text-sm ${getTrendColor(timeImprovement, true)}`}>
                {timeImprovement > 0 ? '-' : '+'}{Math.abs(timeImprovement).toFixed(0)}ms
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {timeImprovement > 0 ? 'Faster' : timeImprovement < 0 ? 'Slower' : 'No change'}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-400" />
              <span className="text-white font-medium">Success Rate</span>
            </div>
            {getTrendIcon(successImprovement)}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {promptVersions[promptVersions.length - 1]?.metrics?.successRate.toFixed(1) || '0.0'}%
              </span>
              <span className={`text-sm ${getTrendColor(successImprovement)}`}>
                {successImprovement > 0 ? '+' : ''}{successImprovement.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={promptVersions[promptVersions.length - 1]?.metrics?.successRate || 0} 
              className="h-2"
            />
          </div>
        </Card>
      </div>

      {/* Performance Trends */}
      {promptVersions.length > 1 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Performance Trends</h3>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {promptVersions.length} versions
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SimpleBarChart 
              data={qualityTrend} 
              label="Quality Score (%)" 
              color="bg-green-500"
            />
            <SimpleBarChart 
              data={timeTrend} 
              label="Response Time (ms)" 
              color="bg-blue-500"
            />
            <SimpleBarChart 
              data={successTrend} 
              label="Success Rate (%)" 
              color="bg-purple-500"
            />
          </div>
        </Card>
      )}

      {/* Comparison Analysis */}
      {comparisonTraces.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Latest Comparison Analysis</h3>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {comparisonTraces.length} test queries
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quality Comparison */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Quality Score Improvement</h4>
              <div className="space-y-2">
                {comparisonTraces.map((trace, index) => {
                  const improvement = trace.rightMetrics.qualityScore - trace.leftMetrics.qualityScore;
                  return (
                    <div key={trace.id} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded">
                      <span className="text-sm text-slate-300">Query {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">
                          {trace.leftMetrics.qualityScore.toFixed(1)}% →{' '}
                          {trace.rightMetrics.qualityScore.toFixed(1)}%
                        </span>
                        <span className={`text-sm font-medium ${getTrendColor(improvement)}`}>
                          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Average Improvement</span>
                  <span className={`font-bold ${getTrendColor(avgQualityImprovement)}`}>
                    {avgQualityImprovement > 0 ? '+' : ''}{avgQualityImprovement.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Response Time Comparison */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Response Time Changes</h4>
              <div className="space-y-2">
                {comparisonTraces.map((trace, index) => {
                  const improvement = trace.leftMetrics.responseTime - trace.rightMetrics.responseTime;
                  return (
                    <div key={trace.id} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded">
                      <span className="text-sm text-slate-300">Query {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">
                          {Math.round(trace.leftMetrics.responseTime)}ms →{' '}
                          {Math.round(trace.rightMetrics.responseTime)}ms
                        </span>
                        <span className={`text-sm font-medium ${getTrendColor(improvement, true)}`}>
                          {improvement > 0 ? '-' : '+'}{Math.abs(improvement).toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Average Change</span>
                  <span className={`font-bold ${getTrendColor(avgTimeImprovement, true)}`}>
                    {avgTimeImprovement > 0 ? '-' : '+'}{Math.abs(avgTimeImprovement).toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Best Version Highlight */}
      {promptVersions.length > 1 && bestVersion && (
        <Card className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-500/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Best Performing Version</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Version {bestVersion.version}</p>
              <p className="text-sm text-slate-300">
                Created: {new Date(bestVersion.timestamp).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {bestVersion.metrics?.qualityScore.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Quality</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {bestVersion.metrics?.responseTime}ms
                </p>
                <p className="text-xs text-slate-400">Speed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {bestVersion.metrics?.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Success</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {promptVersions.length <= 1 && comparisonTraces.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No analytics data yet</h3>
            <p className="text-slate-400 mb-4">Create more prompt versions and run comparisons to see performance analytics</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-slate-800/30 rounded">
                <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Quality Trends</p>
                <p className="text-xs text-slate-500">Track score improvements</p>
              </div>
              
              <div className="text-center p-3 bg-slate-800/30 rounded">
                <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Performance</p>
                <p className="text-xs text-slate-500">Monitor response times</p>
              </div>
              
              <div className="text-center p-3 bg-slate-800/30 rounded">
                <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Comparisons</p>
                <p className="text-xs text-slate-500">Version improvements</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}