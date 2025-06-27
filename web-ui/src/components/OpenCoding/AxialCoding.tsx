'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Edit3,
  Trash2,
  Save,
  ArrowRight,
  Target,
  FileText,
  Group,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

interface AnnotationData {
  trace_id: string;
  open_code_notes: string;
  failure_modes: Record<string, boolean>;
  timestamp?: string;
}

interface DatasetFailureMode {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[];
  created_from_open_codes: string[];
}

interface OpenCodePattern {
  pattern: string;
  frequency: number;
  traces: string[];
  examples: string[];
}

interface AxialCodingProps {
  annotations: Record<string, AnnotationData>;
  totalTraces: number;
  datasetId: string;
  onComplete: (failureModes: DatasetFailureMode[]) => void;
  onCancel: () => void;
}

export function AxialCoding({ 
  annotations, 
  totalTraces, 
  datasetId, 
  onComplete, 
  onCancel 
}: AxialCodingProps) {
  const [openCodePatterns, setOpenCodePatterns] = useState<OpenCodePattern[]>([]);
  const [failureModes, setFailureModes] = useState<DatasetFailureMode[]>([]);
  const [editingMode, setEditingMode] = useState<string | null>(null);
  const [newFailureMode, setNewFailureMode] = useState({
    label: '',
    description: '',
    selectedPatterns: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Log received annotations
  useEffect(() => {
    console.log('AxialCoding received annotations:', annotations);
    console.log('Annotation keys:', Object.keys(annotations));
    console.log('First annotation:', Object.values(annotations)[0]);
  }, [annotations]);

  // Load annotations if not provided
  useEffect(() => {
    const loadAnnotationsIfNeeded = async () => {
      setIsLoading(true);
      
      // If no annotations provided, try to fetch them
      if (!annotations || Object.keys(annotations).length === 0) {
        console.log('No annotations provided, attempting to fetch for dataset:', datasetId);
        try {
          const response = await fetch(`/api/open-coding/annotations/${datasetId}`);
          if (response.ok) {
            const fetchedAnnotations = await response.json();
            console.log('Fetched annotations:', fetchedAnnotations);
            
            // Process fetched annotations
            if (fetchedAnnotations && Object.keys(fetchedAnnotations).length > 0) {
              // Create a local copy to process
              const tempAnnotations = fetchedAnnotations;
              Object.values(tempAnnotations).forEach(annotation => {
                if (annotation.open_code_notes?.trim()) {
                  const notes = annotation.open_code_notes.toLowerCase();
                  console.log('Found annotation with notes:', notes.substring(0, 100));
                }
              });
              
              // Extract patterns from fetched annotations
              extractOpenCodePatterns(fetchedAnnotations);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching annotations:', error);
        }
      }
      
      // Use provided annotations
      if (annotations && Object.keys(annotations).length > 0) {
        extractOpenCodePatterns(annotations);
      } else {
        setIsLoading(false);
      }
    };
    
    loadAnnotationsIfNeeded();
  }, [annotations, datasetId]);

  const extractOpenCodePatterns = (annotationsToProcess?: Record<string, AnnotationData>) => {
    const patterns: Record<string, OpenCodePattern> = {};
    const phrases: Record<string, OpenCodePattern> = {};
    
    const targetAnnotations = annotationsToProcess || annotations;
    console.log('Extracting patterns from annotations:', Object.keys(targetAnnotations).length, 'annotations');
    
    Object.values(targetAnnotations).forEach(annotation => {
      if (annotation.open_code_notes?.trim()) {
        const notes = annotation.open_code_notes.toLowerCase();
        console.log('Processing notes:', notes.substring(0, 100));
        
        // Extract meaningful words (filter out common words)
        const commonWords = new Set(['the', 'and', 'this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'work']);
        const words = notes.split(/\s+/)
          .filter(word => word.length > 3 && !commonWords.has(word))
          .map(word => word.replace(/[^\w]/g, '')); // Remove punctuation
        
        words.forEach(word => {
          if (word && !patterns[word]) {
            patterns[word] = {
              pattern: word,
              frequency: 0,
              traces: [],
              examples: []
            };
          }
          if (word && patterns[word]) {
            patterns[word].frequency += 1;
            if (!patterns[word].traces.includes(annotation.trace_id)) {
              patterns[word].traces.push(annotation.trace_id);
              patterns[word].examples.push(annotation.open_code_notes.substring(0, 100));
            }
          }
        });

        // Also extract 2-word phrases
        for (let i = 0; i < words.length - 1; i++) {
          const phrase = `${words[i]} ${words[i + 1]}`;
          if (phrase.length > 6 && !phrases[phrase]) {
            phrases[phrase] = {
              pattern: phrase,
              frequency: 0,
              traces: [],
              examples: []
            };
          }
          if (phrase.length > 6 && phrases[phrase]) {
            phrases[phrase].frequency += 1;
            if (!phrases[phrase].traces.includes(annotation.trace_id)) {
              phrases[phrase].traces.push(annotation.trace_id);
              phrases[phrase].examples.push(annotation.open_code_notes.substring(0, 100));
            }
          }
        }
      }
    });

    // Combine words and phrases, prefer patterns with higher frequency
    const allPatterns = [...Object.values(patterns), ...Object.values(phrases)];
    
    // More lenient filtering - include single occurrences if we have few annotations
    const annotationCount = Object.keys(targetAnnotations).length;
    const minFrequency = annotationCount > 5 ? 2 : 1;
    
    const meaningfulPatterns = allPatterns
      .filter(pattern => pattern.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Top 20 patterns

    console.log('Extracted patterns:', meaningfulPatterns.length, meaningfulPatterns.map(p => p.pattern));
    setOpenCodePatterns(meaningfulPatterns);
    setIsLoading(false);
  };

  const createFailureMode = () => {
    if (!newFailureMode.label.trim()) return;

    const relatedTraces = new Set<string>();
    const relatedOpenCodes: string[] = [];

    if (newFailureMode.selectedPatterns.length > 0) {
      // Use selected patterns to determine related traces
      newFailureMode.selectedPatterns.forEach(patternText => {
        const pattern = openCodePatterns.find(p => p.pattern === patternText);
        if (pattern) {
          pattern.traces.forEach(traceId => relatedTraces.add(traceId));
          relatedOpenCodes.push(...pattern.examples);
        }
      });
    } else {
      // If no patterns selected, allow manual creation with all traces
      Object.values(annotations).forEach(annotation => {
        relatedTraces.add(annotation.trace_id);
        if (annotation.open_code_notes?.trim()) {
          relatedOpenCodes.push(annotation.open_code_notes);
        }
      });
    }

    const failureMode: DatasetFailureMode = {
      id: `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: newFailureMode.label,
      description: newFailureMode.description,
      count: relatedTraces.size,
      percentage: totalTraces > 0 ? (relatedTraces.size / totalTraces) * 100 : 0,
      traces: Array.from(relatedTraces),
      created_from_open_codes: relatedOpenCodes
    };

    setFailureModes(prev => [...prev, failureMode]);
    setNewFailureMode({ label: '', description: '', selectedPatterns: [] });
  };

  const deleteFailureMode = (id: string) => {
    setFailureModes(prev => prev.filter(fm => fm.id !== id));
  };

  const handleComplete = () => {
    onComplete(failureModes);
  };

  const togglePatternSelection = (pattern: string) => {
    setNewFailureMode(prev => ({
      ...prev,
      selectedPatterns: prev.selectedPatterns.includes(pattern)
        ? prev.selectedPatterns.filter(p => p !== pattern)
        : [...prev.selectedPatterns, pattern]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Group className="h-6 w-6" />
              <span>Axial Coding</span>
            </h2>
            <p className="text-slate-300 mt-1">
              Group open coding patterns into meaningful failure modes for dataset: <code className="text-cyan-400">{datasetId}</code>
            </p>
            {Object.keys(annotations).length === 0 && (
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ No annotations loaded. Make sure you have completed open coding for this dataset.
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              Back to Summary
            </Button>
            <Button
              onClick={handleComplete}
              disabled={failureModes.length === 0}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Complete Axial Coding ({failureModes.length} modes)
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Code Patterns */}
        <div className="space-y-4">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Extracted Patterns from Open Codes</span>
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {openCodePatterns.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">No patterns extracted yet</p>
                  <p className="text-slate-500 text-sm">
                    {Object.keys(annotations).length === 0 
                      ? 'No annotations found. Make sure you have completed open coding first.'
                      : 'Patterns will appear here once open coding notes are analyzed. Try adding more detailed notes in your annotations.'
                    }
                  </p>
                  
                  {/* Debug info */}
                  <div className="mt-4 text-xs text-slate-600">
                    <p>Debug: {Object.keys(annotations).length} annotations found</p>
                    <p>Notes with content: {Object.values(annotations).filter(a => a.open_code_notes?.trim()).length}</p>
                    <p>Dataset ID: {datasetId}</p>
                  </div>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-white/20 text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    Reload Annotations
                  </Button>
                </div>
              ) : (
                openCodePatterns.map((pattern) => (
                  <div 
                    key={pattern.pattern}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      newFailureMode.selectedPatterns.includes(pattern.pattern)
                        ? 'bg-blue-500/20 border-blue-500/40'
                        : 'bg-slate-800/30 border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => togglePatternSelection(pattern.pattern)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{pattern.pattern}</span>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {pattern.frequency}x in {pattern.traces.length} traces
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Example: "{pattern.examples[0]?.substring(0, 80)}..."
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Create New Failure Mode */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Failure Mode</span>
            </h4>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Failure mode label (e.g., 'Incomplete Responses')"
                value={newFailureMode.label}
                onChange={(e) => setNewFailureMode(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <Textarea
                placeholder="Description of this failure mode..."
                value={newFailureMode.description}
                onChange={(e) => setNewFailureMode(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800/50 border-slate-600 text-slate-200"
                rows={3}
              />
              
              <div className="text-sm text-slate-400">
                {newFailureMode.selectedPatterns.length > 0 ? (
                  <>Selected patterns ({newFailureMode.selectedPatterns.length}): {newFailureMode.selectedPatterns.join(', ')}</>
                ) : openCodePatterns.length > 0 ? (
                  <>No patterns selected. Select patterns above or create manually.</>
                ) : (
                  <>No patterns available. You can still create failure modes manually based on your analysis.</>
                )}
              </div>
              
              <Button
                onClick={createFailureMode}
                disabled={!newFailureMode.label.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Failure Mode {newFailureMode.selectedPatterns.length > 0 ? `(${newFailureMode.selectedPatterns.length} patterns)` : '(Manual)'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Created Failure Modes */}
        <div className="space-y-4">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Dataset Failure Modes ({failureModes.length})</span>
            </h3>
            
            {failureModes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No failure modes created yet.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Select patterns from the left to group them into failure modes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {failureModes.map((mode) => (
                  <div key={mode.id} className="bg-slate-800/30 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-white font-medium">{mode.label}</h4>
                          <Badge variant="outline" className="text-slate-300">
                            {mode.count} traces ({mode.percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{mode.description}</p>
                        <div className="text-xs text-slate-500">
                          Based on {mode.created_from_open_codes.length} open code patterns
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteFailureMode(mode.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/20 p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h5 className="text-white font-medium mb-2">Axial Coding Instructions</h5>
            <div className="text-slate-300 text-sm space-y-1">
              <p>1. Review the extracted patterns from your open coding notes</p>
              <p>2. Select related patterns that represent the same type of failure</p>
              <p>3. Create meaningful failure mode categories with clear labels and descriptions</p>
              <p>4. Each failure mode will be associated with this dataset for future comparison</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}