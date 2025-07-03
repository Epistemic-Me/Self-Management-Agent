'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Play, 
  RotateCw,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { FailureModeSummary } from './FailureModeSummary';
import { AxialCoding } from './AxialCoding';
import { PromptEditor } from './PromptEditor';
import { IterationComparison } from './IterationComparison';

// Types based on backend models
interface TraceData {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  project_id: string;
}

interface AnnotationData {
  trace_id: string;
  open_code_notes: string;
  failure_modes: Record<string, boolean>;
  timestamp?: string;
}

interface ProgressData {
  total_traces: number;
  annotated_traces: number;
  completion_percentage: number;
}

interface OpenCodingProps {
  projectId: string;
  systemPrompt: string;
  sampleQueries: Array<{ id: string; text: string }>;
  onComplete?: () => void;
}

interface PromptVersion {
  version: number;
  content: string;
  timestamp: string;
  executionId?: string;
}

interface DatasetFailureMode {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[];
  created_from_open_codes: string[]; // References to specific open code patterns
}

// Iteration workflow states
type WorkflowState = 'coding' | 'summary' | 'axial_coding' | 'editing' | 'new_dataset_created' | 'annotating_new' | 'axial_coding_new' | 'comparison';

const FAILURE_MODES = [
  { id: 'incomplete_response', label: 'Incomplete Response', description: 'Response lacks sufficient detail or completeness' },
  { id: 'hallucination_issues', label: 'Hallucination Issues', description: 'Response contains fabricated or incorrect information' },
  { id: 'prompt_instruction_ignored', label: 'Prompt Instructions Ignored', description: 'Response does not follow given instructions' },
  { id: 'inappropriate_tone', label: 'Inappropriate Tone', description: 'Response tone does not match requirements' },
  { id: 'missing_context_awareness', label: 'Missing Context Awareness', description: 'Response ignores important context' },
  { id: 'factual_accuracy_errors', label: 'Factual Accuracy Errors', description: 'Response contains factual mistakes' },
  { id: 'formatting_inconsistencies', label: 'Formatting Inconsistencies', description: 'Response formatting is inconsistent or poor' },
  { id: 'bias_or_unfairness', label: 'Bias or Unfairness', description: 'Response shows bias or unfair treatment' }
];

export function OpenCodingInterface({ projectId, systemPrompt, sampleQueries, onComplete }: OpenCodingProps) {
  // State management
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [traces, setTraces] = useState<TraceData[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, AnnotationData>>({});
  const [currentTraceIndex, setCurrentTraceIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressData>({ total_traces: 0, annotated_traces: 0, completion_percentage: 0 });
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationData>({
    trace_id: '',
    open_code_notes: '',
    failure_modes: {}
  });

  // Iteration workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>('coding');
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [currentIterationExecutionId, setCurrentIterationExecutionId] = useState<string | null>(null);
  const [iterationAnnotations, setIterationAnnotations] = useState<Record<string, AnnotationData>>({});
  const [isIterationTesting, setIsIterationTesting] = useState(false);

  // State for new dataset annotation
  const [newTraces, setNewTraces] = useState<TraceData[]>([]);
  const [newAnnotations, setNewAnnotations] = useState<Record<string, AnnotationData>>({});
  const [newCurrentTraceIndex, setNewCurrentTraceIndex] = useState(0);
  const [newProgress, setNewProgress] = useState<ProgressData>({ total_traces: 0, annotated_traces: 0, completion_percentage: 0 });
  const [newCurrentAnnotation, setNewCurrentAnnotation] = useState<AnnotationData>({
    trace_id: '',
    open_code_notes: '',
    failure_modes: {}
  });

  // State for failure modes (axial coding results)
  const [originalDatasetFailureModes, setOriginalDatasetFailureModes] = useState<DatasetFailureMode[]>([]);
  const [newDatasetFailureModes, setNewDatasetFailureModes] = useState<DatasetFailureMode[]>([]);

  // Auto-save current annotation when it changes
  useEffect(() => {
    if (currentAnnotation.trace_id && executionId) {
      const saveAnnotation = async () => {
        try {
          await fetch(`/api/open-coding/annotations/${executionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentAnnotation)
          });
        } catch (error) {
          console.error('Error saving annotation:', error);
        }
      };

      const timeoutId = setTimeout(saveAnnotation, 1000); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [currentAnnotation, executionId]);

  // Load annotation when trace changes
  useEffect(() => {
    if (traces[currentTraceIndex]) {
      const trace = traces[currentTraceIndex];
      const existingAnnotation = annotations[trace.id];
      
      setCurrentAnnotation(existingAnnotation || {
        trace_id: trace.id,
        open_code_notes: '',
        failure_modes: {}
      });
    }
  }, [currentTraceIndex, traces, annotations]);

  // Initialize first prompt version
  useEffect(() => {
    if (promptVersions.length === 0 && systemPrompt) {
      setPromptVersions([{
        version: 1,
        content: systemPrompt,
        timestamp: new Date().toISOString(),
        executionId: executionId || undefined
      }]);
    }
  }, [systemPrompt, executionId, promptVersions.length]);

  const loadIterationAnnotations = useCallback(async () => {
    if (!currentIterationExecutionId) return;
    
    try {
      const response = await fetch(`/api/open-coding/annotations/${currentIterationExecutionId}`);
      if (!response.ok) throw new Error('Failed to load iteration annotations');
      
      const annotationsData = await response.json();
      setIterationAnnotations(annotationsData);
    } catch (error) {
      console.error('Error loading iteration annotations:', error);
    }
  }, [currentIterationExecutionId]);

  // Load new dataset when moving to comparison (manual annotation complete)
  useEffect(() => {
    if (currentIterationExecutionId && workflowState === 'comparison' && Object.keys(iterationAnnotations).length === 0) {
      loadIterationAnnotations();
    }
  }, [currentIterationExecutionId, workflowState, iterationAnnotations, loadIterationAnnotations]);

  // Iteration workflow handlers
  const handleStartIteration = () => {
    setWorkflowState('editing');
  };

  const handleSaveNewPromptVersion = async (newPrompt: string) => {
    const newVersion: PromptVersion = {
      version: promptVersions.length + 1,
      content: newPrompt,
      timestamp: new Date().toISOString()
    };
    
    setPromptVersions(prev => [...prev, newVersion]);
    
    // Create new dataset with the improved prompt
    setIsIterationTesting(true);
    setWorkflowState('new_dataset_created');
    
    try {
      // Execute the same queries with the new prompt to create new dataset
      const response = await fetch('/api/open-coding/execute-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: `${projectId}_v${newVersion.version}`,
          system_prompt: newPrompt,
          sample_queries: sampleQueries
        })
      });

      if (!response.ok) throw new Error('Failed to create new dataset');
      
      const result = await response.json();
      newVersion.executionId = result.execution_id;
      setCurrentIterationExecutionId(result.execution_id);
      
      // Update the version with execution ID
      setPromptVersions(prev => 
        prev.map(v => v.version === newVersion.version ? { ...v, executionId: result.execution_id } : v)
      );
      
    } catch (error) {
      console.error('Error creating new dataset:', error);
      setWorkflowState('editing'); // Return to editing on error
    } finally {
      setIsIterationTesting(false);
    }
  };

  const handleReturnToAnalysis = () => {
    setWorkflowState('summary');
  };

  const handleStartNewIteration = () => {
    setWorkflowState('editing');
  };

  const handleStartAnnotatingNew = () => {
    setWorkflowState('annotating_new');
  };

  const handleCompleteNewAnnotations = async () => {
    // Load the manually annotated data for the new dataset
    await loadIterationAnnotations();
    setWorkflowState('comparison');
  };

  // Execute batch traces
  const handleExecuteBatch = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/open-coding/execute-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          system_prompt: systemPrompt,
          sample_queries: sampleQueries
        })
      });

      if (!response.ok) throw new Error('Failed to execute batch');
      
      const result = await response.json();
      setExecutionId(result.execution_id);
      
      // Load traces
      await loadTraces(result.execution_id);
      await loadAnnotations(result.execution_id);
      await loadProgress(result.execution_id);
      
    } catch (error) {
      console.error('Error executing batch:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Load traces for execution
  const loadTraces = async (execId: string) => {
    try {
      const response = await fetch(`/api/open-coding/traces/${execId}`);
      if (!response.ok) throw new Error('Failed to load traces');
      
      const tracesData = await response.json();
      setTraces(tracesData);
    } catch (error) {
      console.error('Error loading traces:', error);
    }
  };

  // Load annotations for execution
  const loadAnnotations = async (execId: string) => {
    try {
      const response = await fetch(`/api/open-coding/annotations/${execId}`);
      if (!response.ok) throw new Error('Failed to load annotations');
      
      const annotationsData = await response.json();
      setAnnotations(annotationsData);
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };

  // Load progress data
  const loadProgress = async (execId: string) => {
    try {
      const response = await fetch(`/api/open-coding/progress/${execId}`);
      if (!response.ok) throw new Error('Failed to load progress');
      
      const progressData = await response.json();
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  // Save current annotation
  const handleSaveAnnotation = async () => {
    if (!executionId) return;
    
    try {
      await fetch(`/api/open-coding/annotations/${executionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAnnotation)
      });
      
      // Update local annotations
      setAnnotations(prev => ({
        ...prev,
        [currentAnnotation.trace_id]: currentAnnotation
      }));
      
      // Refresh progress
      await loadProgress(executionId);
      
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    if (!executionId) return;
    
    setIsExporting(true);
    try {
      const response = await fetch(`/api/open-coding/export/${executionId}`);
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `open_coding_export_${executionId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Complete open coding and show summary
  const handleCompleteOpenCoding = () => {
    setWorkflowState('summary');
  };

  const handleStartAxialCoding = async () => {
    // Ensure annotations are loaded before transitioning
    if (executionId) {
      await loadAnnotations(executionId);
    }
    console.log('Starting axial coding with annotations:', annotations);
    setWorkflowState('axial_coding');
  };

  const handleCompleteAxialCoding = (failureModes: DatasetFailureMode[]) => {
    setOriginalDatasetFailureModes(failureModes);
    setWorkflowState('editing');
  };

  const handleStartAxialCodingNew = () => {
    setWorkflowState('axial_coding_new');
  };

  const handleCompleteAxialCodingNew = (failureModes: DatasetFailureMode[]) => {
    setNewDatasetFailureModes(failureModes);
    setWorkflowState('comparison');
  };

  // Navigation
  const goToPrevious = () => {
    if (currentTraceIndex > 0) {
      setCurrentTraceIndex(currentTraceIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentTraceIndex < traces.length - 1) {
      setCurrentTraceIndex(currentTraceIndex + 1);
    }
  };

  const currentTrace = traces[currentTraceIndex];

  // Get failure mode summary data for components
  const getFailureModeSummary = () => {
    return FAILURE_MODES.map(mode => {
      const count = Object.values(annotations).filter(
        annotation => annotation.failure_modes?.[mode.id]
      ).length;
      return {
        label: mode.label,
        count,
        percentage: traces.length > 0 ? (count / traces.length) * 100 : 0
      };
    }).filter(failure => failure.count > 0)
     .sort((a, b) => b.count - a.count);
  };

  // Render different workflow states
  if (workflowState === 'summary') {
    return (
      <FailureModeSummary
        annotations={annotations}
        totalTraces={traces.length}
        onStartAxialCoding={handleStartAxialCoding}
      />
    );
  }

  if (workflowState === 'axial_coding') {
    return (
      <AxialCoding
        annotations={annotations}
        totalTraces={traces.length}
        datasetId={executionId || 'unknown'}
        onComplete={handleCompleteAxialCoding}
        onCancel={() => setWorkflowState('summary')}
      />
    );
  }

  if (workflowState === 'editing') {
    // Use failure modes from axial coding instead of simple summary
    const failureModesSummary = originalDatasetFailureModes.map(fm => ({
      label: fm.label,
      count: fm.count,
      percentage: fm.percentage
    }));
    
    return (
      <PromptEditor
        currentPrompt={promptVersions[promptVersions.length - 1]?.content || systemPrompt}
        previousVersions={promptVersions.slice(0, -1)}
        topFailureModes={failureModesSummary}
        datasetFailureModes={originalDatasetFailureModes}
        onSaveVersion={handleSaveNewPromptVersion}
        onCancel={handleReturnToAnalysis}
        isLoading={isIterationTesting}
      />
    );
  }

  if (workflowState === 'axial_coding_new') {
    return (
      <AxialCoding
        annotations={iterationAnnotations}
        totalTraces={sampleQueries.length}
        datasetId={currentIterationExecutionId || 'unknown'}
        onComplete={handleCompleteAxialCodingNew}
        onCancel={() => setWorkflowState('annotating_new')}
      />
    );
  }

  if (workflowState === 'new_dataset_created') {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center space-y-4">
            {isIterationTesting ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-white text-lg">Creating New Dataset</p>
                <p className="text-slate-400">Generating traces with your improved prompt...</p>
              </>
            ) : (
              <>
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-white text-xl mb-2">New Dataset Created!</p>
                <p className="text-slate-400 mb-6">
                  Version {promptVersions.length} dataset has been generated with {sampleQueries.length} traces.
                  <br />
                  Now you need to manually annotate each trace to identify failure modes.
                </p>
                <Button
                  onClick={handleStartAnnotatingNew}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Start Annotating New Dataset
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (workflowState === 'annotating_new') {
    // For now, redirect to creating a new OpenCodingInterface instance for the new dataset
    // This ensures the developer manually annotates the new dataset
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <p className="text-white text-xl mb-2">Ready to Annotate New Dataset</p>
            <p className="text-slate-400 mb-6">
              Your improved prompt (Version {promptVersions.length}) has generated a new dataset with {sampleQueries.length} traces.
              <br />
              <strong>Manual annotation required:</strong> You need to review each trace and apply failure mode annotations.
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                <strong>Next Steps:</strong>
                <br />
                1. Open a new Open Coding session for dataset: <code>{currentIterationExecutionId}</code>
                <br />
                2. Manually annotate each trace with failure modes 
                <br />
                3. Complete at least 80% of annotations
                <br />
                4. Return here to compare with original dataset
              </p>
            </div>

            <div className="flex space-x-3 justify-center">
              <Button
                onClick={handleReturnToAnalysis}
                variant="outline"
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
              >
                Return to Analysis
              </Button>
              <Button
                onClick={handleStartAxialCodingNew}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                I've Completed Annotations - Start Axial Coding
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (workflowState === 'comparison') {
    return (
      <IterationComparison
        beforeFailureModes={originalDatasetFailureModes}
        afterFailureModes={newDatasetFailureModes}
        beforeDatasetId={executionId || 'unknown'}
        afterDatasetId={currentIterationExecutionId || 'unknown'}
        beforeVersion={promptVersions.length > 0 ? promptVersions[0].version : 1}
        afterVersion={promptVersions.length > 0 ? promptVersions[promptVersions.length - 1].version : 2}
        onStartNewIteration={handleStartNewIteration}
        onReturnToAnalysis={handleReturnToAnalysis}
      />
    );
  }

  // Default: original open coding interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Open Coding Interface</span>
            </h2>
            <p className="text-slate-300 mt-1">
              Systematic analysis of prompt testing traces for qualitative evaluation
            </p>
          </div>
          
          {!executionId ? (
            <Button 
              onClick={handleExecuteBatch}
              disabled={isExecuting}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isExecuting ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Batch ({sampleQueries.length} queries)
                </>
              )}
            </Button>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
              >
                {isExporting ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
              
              {progress.completion_percentage >= 80 && (
                <Button
                  onClick={handleCompleteOpenCoding}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Analyze & Improve
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {executionId && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">
                Progress: {progress.annotated_traces}/{progress.total_traces} traces annotated
              </span>
              <span className="text-sm text-slate-300">
                {progress.completion_percentage}% complete
              </span>
            </div>
            <Progress value={progress.completion_percentage} className="h-2" />
          </div>
        )}
      </Card>

      {/* Main Interface */}
      {executionId && traces.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trace Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Navigation */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={goToPrevious}
                  disabled={currentTraceIndex === 0}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">
                    Trace {currentTraceIndex + 1} of {traces.length}
                  </span>
                  <Badge 
                    variant={annotations[currentTrace?.id] ? "default" : "secondary"}
                    className={annotations[currentTrace?.id] ? "bg-green-500/20 text-green-400" : ""}
                  >
                    {annotations[currentTrace?.id] ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Annotated
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
                
                <Button
                  onClick={goToNext}
                  disabled={currentTraceIndex === traces.length - 1}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>

            {/* Query */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Query</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-slate-200">{currentTrace?.query}</p>
              </div>
            </Card>

            {/* Response */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">AI Response</h3>
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-slate-200 whitespace-pre-wrap">{currentTrace?.response}</p>
              </div>
            </Card>
          </div>

          {/* Annotation Panel */}
          <div className="space-y-4">
            {/* Failure Modes */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Failure Modes</h3>
              <div className="space-y-3">
                {FAILURE_MODES.map((mode) => (
                  <div key={mode.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={mode.id}
                      checked={currentAnnotation.failure_modes[mode.id] || false}
                      onCheckedChange={(checked) => {
                        setCurrentAnnotation(prev => ({
                          ...prev,
                          failure_modes: {
                            ...prev.failure_modes,
                            [mode.id]: !!checked
                          }
                        }));
                      }}
                    />
                    <div>
                      <label htmlFor={mode.id} className="text-sm font-medium text-white cursor-pointer">
                        {mode.label}
                      </label>
                      <p className="text-xs text-slate-400">{mode.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Open Coding Notes */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Open Coding Notes</h3>
              <Textarea
                placeholder="Add qualitative observations, patterns, and insights..."
                value={currentAnnotation.open_code_notes}
                onChange={(e) => {
                  setCurrentAnnotation(prev => ({
                    ...prev,
                    open_code_notes: e.target.value
                  }));
                }}
                className="min-h-32 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500"
              />
              
              <Button
                onClick={handleSaveAnnotation}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Annotation
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!executionId && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use Open Coding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h4 className="font-medium text-white mb-2">Execute Batch</h4>
              <p className="text-slate-400 text-sm">
                Run all sample queries against your system prompt to generate traces
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h4 className="font-medium text-white mb-2">Annotate Traces</h4>
              <p className="text-slate-400 text-sm">
                Review each response, mark failure modes, and add qualitative notes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <h4 className="font-medium text-white mb-2">Export Analysis</h4>
              <p className="text-slate-400 text-sm">
                Download CSV with all traces, annotations, and failure mode data
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}