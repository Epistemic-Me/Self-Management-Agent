'use client';

import React, { useState } from 'react';
import { X, Play, CheckCircle, AlertCircle, Clock, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AgentNode } from '@/types/agent-evaluation';

interface ComponentTestingModalProps {
  node: AgentNode;
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  component: 'router' | 'retriever' | 'tool';
  success: boolean;
  result: any;
  executionTime: number;
  error?: string;
}

interface ComponentTestResults {
  router?: TestResult;
  retriever?: TestResult;
  tool?: TestResult;
  endToEnd?: TestResult;
}

export function ComponentTestingModal({ node, isOpen, onClose }: ComponentTestingModalProps) {
  const [testQuery, setTestQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ComponentTestResults>({});
  const [activeTab, setActiveTab] = useState('router');

  // Only show for sub-intent nodes
  if (node.type !== 'subintent' && node.type !== 'sub_intent') {
    return null;
  }

  const runRouterTest = async () => {
    setIsRunning(true);
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/health-coach/test-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          nodeId: node.id
        })
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        router: {
          component: 'router',
          success: response.ok,
          result,
          executionTime,
          error: !response.ok ? result.error : undefined
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        router: {
          component: 'router',
          success: false,
          result: null,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const runRetrieverTest = async () => {
    setIsRunning(true);
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/health-coach/test-retriever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          nodeId: node.id
        })
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        retriever: {
          component: 'retriever',
          success: response.ok,
          result,
          executionTime,
          error: !response.ok ? result.error : undefined
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        retriever: {
          component: 'retriever',
          success: false,
          result: null,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const runToolTest = async () => {
    setIsRunning(true);
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/health-coach/test-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          nodeId: node.id,
          context: results.retriever?.result // Use retriever results if available
        })
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        tool: {
          component: 'tool',
          success: response.ok,
          result,
          executionTime,
          error: !response.ok ? result.error : undefined
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        tool: {
          component: 'tool',
          success: false,
          result: null,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const runEndToEndTest = async () => {
    setIsRunning(true);
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/health-coach/test-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          nodeId: node.id
        })
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        endToEnd: {
          component: 'tool',
          success: response.ok,
          result,
          executionTime,
          error: !response.ok ? result.error : undefined
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        endToEnd: {
          component: 'tool',
          success: false,
          result: null,
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const resetResults = () => {
    setResults({});
  };

  const getStatusIcon = (testResult?: TestResult) => {
    if (!testResult) return <Clock className="h-4 w-4 text-slate-400" />;
    if (testResult.success) return <CheckCircle className="h-4 w-4 text-green-400" />;
    return <AlertCircle className="h-4 w-4 text-red-400" />;
  };

  const getStatusColor = (testResult?: TestResult) => {
    if (!testResult) return 'text-slate-400';
    if (testResult.success) return 'text-green-400';
    return 'text-red-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <TestTube className="h-6 w-6 text-cyan-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {node.component_type === 'tool' ? 'Tool' : 'Retriever'} Testing
              </h2>
              <p className="text-sm text-slate-400">
                {node.name}
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${
                  node.component_type === 'tool' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {node.component_type === 'tool' ? '🔧 Tool' : '📥 Retriever'}
                </span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Test Query Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Test Query
            </label>
            <Textarea
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter a query to test this component..."
              className="bg-slate-800 border-slate-600 text-white"
              rows={3}
            />
            
            {/* Example queries */}
            {node.sampleQueries && node.sampleQueries.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 mb-1">Example queries:</p>
                <div className="flex flex-wrap gap-2">
                  {node.sampleQueries.map((query) => (
                    <Badge
                      key={query.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-slate-600 bg-slate-700 text-slate-300"
                      onClick={() => setTestQuery(query.text)}
                    >
                      {query.text}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Controls */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={node.component_type === 'tool' ? runToolTest : runRetrieverTest}
              disabled={!testQuery.trim() || isRunning}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test {node.component_type === 'tool' ? 'Tool' : 'Retriever'}
                </>
              )}
            </Button>
            
            <Button
              onClick={runRouterTest}
              disabled={!testQuery.trim() || isRunning}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Test Router
            </Button>
            
            <Button
              onClick={resetResults}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Reset Results
            </Button>
          </div>

          {/* Test Results */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${node.component_type === 'tool' ? 'grid-cols-3' : 'grid-cols-3'} bg-slate-800`}>
              <TabsTrigger 
                value="router" 
                className="flex items-center gap-2 data-[state=active]:bg-slate-700"
              >
                {getStatusIcon(results.router)}
                Router
              </TabsTrigger>
              
              {node.component_type === 'tool' ? (
                <>
                  <TabsTrigger 
                    value="tool"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700"
                  >
                    {getStatusIcon(results.tool)}
                    Response Quality
                  </TabsTrigger>
                  <TabsTrigger 
                    value="constraints"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700"
                  >
                    {getStatusIcon(results.tool)}
                    Constraints
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger 
                    value="retriever"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700"
                  >
                    {getStatusIcon(results.retriever)}
                    Data Accuracy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completeness"
                    className="flex items-center gap-2 data-[state=active]:bg-slate-700"
                  >
                    {getStatusIcon(results.retriever)}
                    Completeness
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="router" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Router Test</CardTitle>
                      <CardDescription>
                        Test if this sub-intent is correctly identified from the query
                      </CardDescription>
                    </div>
                    <Button
                      onClick={runRouterTest}
                      disabled={!testQuery.trim() || isRunning}
                      size="sm"
                      variant="outline"
                      className="border-slate-600"
                    >
                      Test Router
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.router ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${getStatusColor(results.router)}`}>
                          {getStatusIcon(results.router)}
                          <span className="font-medium">
                            {results.router.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                          {results.router.executionTime}ms
                        </Badge>
                      </div>
                      
                      {results.router.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          {results.router.error}
                        </div>
                      )}
                      
                      {results.router.result && (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-300">Routing Result:</p>
                          <pre className="bg-slate-900 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                            {JSON.stringify(results.router.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">No test results yet. Click "Test Router" to run.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retriever" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Retriever Test</CardTitle>
                      <CardDescription>
                        Test data retrieval for this sub-intent
                      </CardDescription>
                    </div>
                    <Button
                      onClick={runRetrieverTest}
                      disabled={!testQuery.trim() || isRunning}
                      size="sm"
                      variant="outline"
                      className="border-slate-600"
                    >
                      Test Retriever
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.retriever ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${getStatusColor(results.retriever)}`}>
                          {getStatusIcon(results.retriever)}
                          <span className="font-medium">
                            {results.retriever.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                          {results.retriever.executionTime}ms
                        </Badge>
                      </div>
                      
                      {results.retriever.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          {results.retriever.error}
                        </div>
                      )}
                      
                      {results.retriever.result && (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-300">Retrieved Data:</p>
                          <pre className="bg-slate-900 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                            {JSON.stringify(results.retriever.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">No test results yet. Click "Test Retriever" to run.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tool" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Tool Test</CardTitle>
                      <CardDescription>
                        Test response generation and constraint compliance
                      </CardDescription>
                    </div>
                    <Button
                      onClick={runToolTest}
                      disabled={!testQuery.trim() || isRunning}
                      size="sm"
                      variant="outline"
                      className="border-slate-600"
                    >
                      Test Tool
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.tool ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${getStatusColor(results.tool)}`}>
                          {getStatusIcon(results.tool)}
                          <span className="font-medium">
                            {results.tool.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                          {results.tool.executionTime}ms
                        </Badge>
                      </div>
                      
                      {results.tool.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          {results.tool.error}
                        </div>
                      )}
                      
                      {results.tool.result && (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-300">Generated Response:</p>
                          <div className="bg-slate-900 p-3 rounded text-sm text-slate-300">
                            {results.tool.result.response}
                          </div>
                          
                          {results.tool.result.constraints && (
                            <div className="mt-4">
                              <p className="text-sm text-slate-300 mb-2">Constraint Compliance:</p>
                              <div className="space-y-1">
                                {results.tool.result.constraints.map((constraint: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    {constraint.passed ? (
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className={constraint.passed ? 'text-green-400' : 'text-red-400'}>
                                      {constraint.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">No test results yet. Click "Test Tool" to run.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endtoend" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">End-to-End Test</CardTitle>
                  <CardDescription>
                    Complete component test: Router → Retriever → Tool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.endToEnd ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${getStatusColor(results.endToEnd)}`}>
                          {getStatusIcon(results.endToEnd)}
                          <span className="font-medium">
                            {results.endToEnd.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                          {results.endToEnd.executionTime}ms
                        </Badge>
                      </div>
                      
                      {results.endToEnd.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          {results.endToEnd.error}
                        </div>
                      )}
                      
                      {results.endToEnd.result && (
                        <div className="space-y-4">
                          <div className="bg-slate-900 p-3 rounded">
                            <p className="text-sm text-slate-300 mb-2">Final Response:</p>
                            <div className="text-sm text-white">
                              {results.endToEnd.result.response}
                            </div>
                          </div>
                          
                          {results.endToEnd.result.pipeline && (
                            <div className="space-y-2">
                              <p className="text-sm text-slate-300">Pipeline Execution:</p>
                              <div className="space-y-2">
                                {results.endToEnd.result.pipeline.map((step: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                                      {step.component}
                                    </Badge>
                                    <span className={step.success ? 'text-green-400' : 'text-red-400'}>
                                      {step.success ? 'Success' : 'Failed'}
                                    </span>
                                    <span className="text-slate-400">
                                      {step.executionTime}ms
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">No test results yet. Click "Run Full Test" to run.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}