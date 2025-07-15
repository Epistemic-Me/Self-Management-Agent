'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Database, 
  Zap, 
  BarChart3, 
  Settings, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Users,
  FileText
} from 'lucide-react';

// Mock data - in real implementation, this would come from API
const CONTEXT_TYPES = [
  {
    id: 'evidence_gathering',
    name: 'Evidence Gathering',
    description: 'Collecting and analyzing health evidence for decision making',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    id: 'protocol_recommendation',
    name: 'Protocol Recommendation',
    description: 'Suggesting personalized health optimization protocols',
    icon: Target,
    color: 'bg-green-500'
  },
  {
    id: 'progress_tracking',
    name: 'Progress Tracking',
    description: 'Monitoring health metrics and improvement trends',
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
  {
    id: 'belief_revision',
    name: 'Belief Revision',
    description: 'Updating health beliefs based on new evidence',
    icon: Brain,
    color: 'bg-orange-500'
  }
];

const DATA_SOURCES = [
  { id: 'user_profile', name: 'User Profile', status: 'complete' },
  { id: 'beliefs', name: 'Health Beliefs', status: 'complete' },
  { id: 'measurements', name: 'Measurements', status: 'complete' },
  { id: 'biomarkers', name: 'Biomarkers', status: 'pending' },
  { id: 'dd_scores', name: 'Don\'t Die Scores', status: 'complete' },
  { id: 'protocols', name: 'Active Protocols', status: 'in_progress' },
  { id: 'capabilities', name: 'Physical Capabilities', status: 'complete' },
  { id: 'checklist_status', name: 'Data Completeness', status: 'complete' }
];

interface ContextMetrics {
  context_type: string;
  total_requests: number;
  avg_preparation_time_ms: number;
  avg_token_utilization: number;
  cache_hit_rate: number;
  avg_relevance_score?: number;
  avg_satisfaction_score?: number;
  avg_effectiveness_score?: number;
}

interface ContextData {
  context_type: string;
  user_id: string;
  context_data: any;
  metadata: any;
  token_count: number;
  cached: boolean;
}

export default function PersonalizationContextsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedContext, setSelectedContext] = useState('evidence_gathering');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [metrics, setMetrics] = useState<ContextMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      // In real implementation, fetch from API
      // const response = await fetch('/personalization/metrics/current-user');
      // const data = await response.json();
      
      // Mock metrics data
      const mockMetrics: ContextMetrics[] = [
        {
          context_type: 'evidence_gathering',
          total_requests: 45,
          avg_preparation_time_ms: 185,
          avg_token_utilization: 0.76,
          cache_hit_rate: 0.68,
          avg_relevance_score: 0.84,
          avg_satisfaction_score: 0.91
        },
        {
          context_type: 'protocol_recommendation',
          total_requests: 32,
          avg_preparation_time_ms: 220,
          avg_token_utilization: 0.82,
          cache_hit_rate: 0.55,
          avg_relevance_score: 0.89,
          avg_effectiveness_score: 0.87
        },
        {
          context_type: 'progress_tracking',
          total_requests: 28,
          avg_preparation_time_ms: 165,
          avg_token_utilization: 0.71,
          cache_hit_rate: 0.75,
          avg_satisfaction_score: 0.88
        },
        {
          context_type: 'belief_revision',
          total_requests: 12,
          avg_preparation_time_ms: 240,
          avg_token_utilization: 0.85,
          cache_hit_rate: 0.42,
          avg_relevance_score: 0.78
        }
      ];
      
      setMetrics(mockMetrics);
    } catch (err) {
      setError('Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadContextData = async (contextType: string, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In real implementation, fetch from API
      // const url = `/personalization/contexts/${contextType}${forceRefresh ? '?force_refresh=true' : ''}`;
      // const response = await fetch(url);
      // const data = await response.json();
      
      // Mock context data
      const mockContextData: ContextData = {
        context_type: contextType,
        user_id: 'current-user',
        context_data: {
          user_profile: { id: 'user-123', name: 'Test User' },
          beliefs: [
            { statement: 'Exercise improves my energy', confidence: 0.9 },
            { statement: 'Sleep affects my performance', confidence: 0.85 }
          ],
          measurements: [
            { type: 'weight', value: 70.5, unit: 'kg' },
            { type: 'body_fat', value: 15.2, unit: '%' }
          ],
          _metadata: {
            data_sources: ['user_profile', 'beliefs', 'measurements', 'biomarkers'],
            generated_at: new Date().toISOString()
          }
        },
        metadata: {
          context_type: contextType,
          generated_at: new Date().toISOString(),
          token_count: 1450,
          data_sources: ['user_profile', 'beliefs', 'measurements']
        },
        token_count: 1450,
        cached: !forceRefresh
      };
      
      setContextData(mockContextData);
    } catch (err) {
      setError('Failed to load context data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async (contextType: string) => {
    try {
      setIsLoading(true);
      // In real implementation: await fetch(`/personalization/cache/${contextType}`, { method: 'DELETE' });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh context data
      await loadContextData(contextType, true);
    } catch (err) {
      setError('Failed to clear cache');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Personalization Contexts</h1>
          <p className="text-slate-400">
            Manage and monitor <span className="text-cyan-400">AI health coach personalization</span> settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Brain className="h-4 w-4 mr-2" />
            {metrics.reduce((sum, m) => sum + m.total_requests, 0)} Total Requests
          </Badge>
          <Button 
            onClick={() => loadMetrics()} 
            disabled={isLoading}
            variant="outline"
            className="text-slate-300 border-slate-600 hover:border-cyan-500 hover:text-cyan-400"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Overview</TabsTrigger>
          <TabsTrigger value="contexts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Context Management</TabsTrigger>
          <TabsTrigger value="data-sources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Data Sources</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-300">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTEXT_TYPES.map((context) => {
              const contextMetrics = metrics.find(m => m.context_type === context.id);
              const Icon = context.icon;
              
              return (
                <Card key={context.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${context.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {contextMetrics?.total_requests || 0} uses
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-white">{context.name}</h3>
                      <p className="text-xs text-slate-400">{context.description}</p>
                      
                      {contextMetrics && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Token Usage</span>
                            <span>{Math.round(contextMetrics.avg_token_utilization * 100)}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${contextMetrics.avg_token_utilization * 100}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Cache Hit Rate</span>
                            <span>{Math.round(contextMetrics.cache_hit_rate * 100)}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${contextMetrics.cache_hit_rate * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {metrics.reduce((sum, m) => sum + m.total_requests, 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(metrics.reduce((sum, m) => sum + m.avg_preparation_time_ms, 0) / metrics.length || 0)}ms
                  </div>
                  <div className="text-sm text-slate-400">Avg Preparation Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round((metrics.reduce((sum, m) => sum + m.cache_hit_rate, 0) / metrics.length || 0) * 100)}%
                  </div>
                  <div className="text-sm text-slate-400">Overall Cache Hit Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contexts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Context Types</CardTitle>
                <CardDescription className="text-slate-400">Select a context to manage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {CONTEXT_TYPES.map((context) => {
                  const Icon = context.icon;
                  return (
                    <div
                      key={context.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                        selectedContext === context.id 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : 'border-white/10 hover:border-cyan-500/50 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedContext(context.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${context.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-white">{context.name}</div>
                          <div className="text-xs text-slate-400">{context.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Context Preview</CardTitle>
                    <CardDescription className="text-slate-400">
                      {CONTEXT_TYPES.find(c => c.id === selectedContext)?.name || 'Select a context'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadContextData(selectedContext)}
                      disabled={isLoading}
                      className="text-slate-300 border-slate-600 hover:border-cyan-500 hover:text-cyan-400"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCache(selectedContext)}
                      disabled={isLoading}
                      className="text-slate-300 border-slate-600 hover:border-red-500 hover:text-red-400"
                    >
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contextData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${contextData.cached ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>
                          {contextData.cached ? "Cached" : "Fresh"}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {contextData.token_count} tokens
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Generated: {new Date(contextData.metadata.generated_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Data Sources Included</h4>
                      <div className="flex flex-wrap gap-2">
                        {contextData.metadata.data_sources.map((source: string) => (
                          <Badge key={source} className="bg-blue-500/20 text-blue-400 border-blue-500/30">{source}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Context Data Preview</h4>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <pre className="text-xs text-slate-300 overflow-auto max-h-64">
                          {JSON.stringify(contextData.context_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Load" to preview context data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5" />
                Data Source Availability
              </CardTitle>
              <CardDescription className="text-slate-400">
                Monitor the completeness and freshness of your personalization data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {DATA_SOURCES.map((source) => {
                  const StatusIcon = getStatusIcon(source.status);
                  
                  return (
                    <div key={source.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded ${getStatusColor(source.status)}`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                        <Badge className={`${source.status === 'complete' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {source.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm text-white">{source.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Last updated: 2 hours ago
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Data Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">Overall Completeness</span>
                      <span className="text-white font-bold">75%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {DATA_SOURCES.map((source) => (
                      <div key={source.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{source.name}</span>
                          <span className="text-xs text-slate-400">
                            {source.status === 'complete' ? '100%' : source.status === 'in_progress' ? '50%' : '0%'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              source.status === 'complete' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                              source.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                              'bg-gray-500'
                            }`}
                            style={{ width: `${source.status === 'complete' ? 100 : source.status === 'in_progress' ? 50 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Data Freshness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">Fresh Data (&lt; 1 hour)</span>
                      <span className="text-white font-semibold text-sm">4 sources</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '50%' }}
                      />
                    </div>
                    
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">Recent Data (&lt; 24 hours)</span>
                      <span className="text-white font-semibold text-sm">6 sources</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '75%' }}
                      />
                    </div>
                    
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">Stale Data (&gt; 24 hours)</span>
                      <span className="text-white font-semibold text-sm">2 sources</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '25%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => {
                    const contextName = CONTEXT_TYPES.find(c => c.id === metric.context_type)?.name || metric.context_type;
                    
                    return (
                      <div key={metric.context_type} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-white">{contextName}</h3>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{metric.total_requests} requests</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Prep Time</div>
                            <div className="font-medium text-white">{metric.avg_preparation_time_ms}ms</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Token Usage</div>
                            <div className="font-medium text-white">{Math.round(metric.avg_token_utilization * 100)}%</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Cache Rate</div>
                            <div className="font-medium text-white">{Math.round(metric.cache_hit_rate * 100)}%</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Relevance</div>
                            <div className="font-medium text-white">
                              {metric.avg_relevance_score ? `${Math.round(metric.avg_relevance_score * 100)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="bg-blue-500 p-1 rounded">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">Improve Cache Hit Rate</div>
                      <div className="text-xs text-slate-400">
                        Belief revision context has low cache hit rate (42%). Consider increasing cache duration.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="bg-green-500 p-1 rounded">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">Optimize Token Usage</div>
                      <div className="text-xs text-slate-400">
                        Protocol recommendation context uses 82% of tokens efficiently. Well optimized!
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="bg-yellow-500 p-1 rounded">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">Update Data Sources</div>
                      <div className="text-xs text-slate-400">
                        Biomarker data is pending. Complete lab work upload to improve context quality.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}