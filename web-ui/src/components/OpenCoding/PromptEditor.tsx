'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit3,
  Save,
  RotateCcw,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface PromptVersion {
  version: number;
  content: string;
  timestamp: string;
  based_on_analysis?: string; // reference to the analysis that led to this version
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

interface PromptEditorProps {
  currentPrompt: string;
  previousVersions: PromptVersion[];
  topFailureModes: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  datasetFailureModes?: DatasetFailureMode[];
  onSaveVersion: (newPrompt: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PromptEditor({ 
  currentPrompt, 
  previousVersions,
  topFailureModes,
  datasetFailureModes,
  onSaveVersion, 
  onCancel,
  isLoading = false
}: PromptEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
  const [hasChanges, setHasChanges] = useState(false);

  const currentVersion = previousVersions.length + 1;

  const handlePromptChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== currentPrompt);
  };

  const handleSave = () => {
    if (hasChanges && editedPrompt.trim()) {
      onSaveVersion(editedPrompt.trim());
    }
  };

  const handleReset = () => {
    setEditedPrompt(currentPrompt);
    setHasChanges(false);
  };

  const wordCount = editedPrompt.trim().split(/\s+/).length;
  const charCount = editedPrompt.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Edit Prompt</h3>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              Version {currentVersion}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleReset}
              disabled={!hasChanges}
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          {wordCount} words • {charCount} characters
          {hasChanges && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
        </div>
      </Card>

      {/* Improvement guidance based on failure analysis */}
      {topFailureModes.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/20 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-white font-medium mb-1">Focus Areas for Improvement</h4>
              <p className="text-sm text-slate-300 mb-3">
                Based on your open coding analysis, consider addressing these issues:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {topFailureModes.slice(0, 3).map((failure, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-medium">{index + 1}</span>
                </div>
                <span className="text-slate-300">
                  <strong>{failure.label}</strong> - occurred in {failure.count} traces ({failure.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> Be specific about requirements that address these failure modes. 
              Add explicit instructions, examples, or constraints to prevent these issues.
            </p>
          </div>
        </Card>
      )}

      {/* Version history */}
      {previousVersions.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Version History</span>
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {previousVersions.slice().reverse().map((version) => (
              <div key={version.version} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded text-sm">
                <span className="text-slate-300">
                  Version {version.version}
                </span>
                <span className="text-slate-400">
                  {new Date(version.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Prompt editor */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <h4 className="text-white font-medium mb-3">Prompt Content</h4>
        
        <Textarea
          value={editedPrompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Enter your improved system prompt here..."
          className="min-h-64 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 font-mono text-sm"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-400">
            Make targeted improvements to address the failure modes identified in your analysis.
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !editedPrompt.trim() || isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Creating Dataset...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Dataset v{currentVersion}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Guidelines */}
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm border border-green-500/20 p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
          <div>
            <h5 className="text-white font-medium mb-1">Prompt Improvement Tips</h5>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Add specific instructions to prevent identified failure modes</li>
              <li>• Include examples of desired vs undesired responses</li>
              <li>• Specify output format, tone, and constraints clearly</li>
              <li>• Test with the same queries to measure actual improvement</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}