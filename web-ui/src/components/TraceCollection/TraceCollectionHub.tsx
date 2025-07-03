'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface TraceFile {
  id: string;
  filename: string;
  fileSize: number;
  validationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  qualityScore?: number;
  traceCount?: number;
  uploadedAt: string;
  processedAt?: string;
  validationErrors?: string;
}

interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'uploaded' | 'validating' | 'completed' | 'error';
  error?: string;
}

export function TraceCollectionHub() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [traceFiles, setTraceFiles] = useState<TraceFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Polling function to check validation status
  const pollValidationStatus = useCallback(async (traceFileId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max polling
    
    const poll = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/traces/${traceFileId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const traceFile = result.data;
          
          // Update trace files list
          setTraceFiles(prev => {
            const index = prev.findIndex(tf => tf.id === traceFileId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = traceFile;
              return updated;
            }
            return [...prev, traceFile];
          });

          // Update upload progress
          setUploadProgress(prev => 
            prev.map(up => 
              up.fileId === traceFileId 
                ? { 
                    ...up, 
                    status: traceFile.validationStatus === 'completed' ? 'completed' : 'validating'
                  }
                : up
            )
          );

          // Continue polling if still processing
          if (traceFile.validationStatus === 'processing' && attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 1000);
          } else if (traceFile.validationStatus === 'completed') {
            toast({
              title: "Validation Complete",
              description: `${traceFile.filename} processed with ${traceFile.qualityScore}% quality score`,
            });
          } else if (traceFile.validationStatus === 'failed') {
            toast({
              title: "Validation Failed",
              description: `${traceFile.filename} failed validation`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error polling validation status:', error);
      }
    };

    poll();
  }, [toast]);

  const uploadFile = useCallback(async (file: File) => {
    const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileId,
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('upload', file);

      const response = await fetch('/api/traces/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const traceFileId = result.data.trace_file_id;
        
        // Update progress to uploaded
        setUploadProgress(prev => 
          prev.map(up => 
            up.fileId === fileId 
              ? { ...up, fileId: traceFileId, progress: 100, status: 'validating' }
              : up
          )
        );

        // Start polling for validation status
        pollValidationStatus(traceFileId);

        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded and validation started`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      setUploadProgress(prev => 
        prev.map(up => 
          up.fileId === fileId 
            ? { ...up, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : up
        )
      );

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  }, [pollValidationStatus, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/json' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json')
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only CSV and JSON files are supported",
        variant: "destructive",
      });
    }

    validFiles.forEach(uploadFile);
  }, [toast, uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadProgress = (fileId: string) => {
    setUploadProgress(prev => prev.filter(up => up.fileId !== fileId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, qualityScore?: number) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        const scoreColor = qualityScore && qualityScore >= 80 ? 'bg-green-500' : 
                          qualityScore && qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';
        return <Badge className={`text-white ${scoreColor}`}>
          Completed ({qualityScore}%)
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="trace-collection-hub">
      {/* Upload Area */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trace Collection & Validation</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            hover:border-blue-400 hover:bg-gray-50
          `}
          data-testid="file-drop-zone"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop trace files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports CSV and JSON files up to 100MB
          </p>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            data-testid="browse-files-button"
          >
            Browse Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
        </div>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Progress</h3>
          <div className="space-y-3">
            {uploadProgress.map((upload) => (
              <div key={upload.fileId} className="flex items-center space-x-3">
                {getStatusIcon(upload.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{upload.filename}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadProgress(upload.fileId)}
                      data-testid={`remove-upload-${upload.fileId}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-2" />
                  )}
                  {upload.status === 'validating' && (
                    <div className="text-xs text-blue-600">Validating traces...</div>
                  )}
                  {upload.status === 'error' && (
                    <div className="text-xs text-red-600">{upload.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trace Files List */}
      {traceFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Trace Files</h3>
          <div className="space-y-3">
            {traceFiles.map((traceFile) => (
              <div 
                key={traceFile.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`trace-file-${traceFile.id}`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{traceFile.filename}</div>
                    <div className="text-sm text-gray-500">
                      {(traceFile.fileSize / 1024).toFixed(1)} KB
                      {traceFile.traceCount && ` • ${traceFile.traceCount} traces`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusBadge(traceFile.validationStatus, traceFile.qualityScore)}
                  {traceFile.validationStatus === 'failed' && traceFile.validationErrors && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Validation Errors",
                          description: traceFile.validationErrors,
                          variant: "destructive",
                        });
                      }}
                    >
                      View Errors
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">How to Use</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Upload CSV or JSON files containing conversation traces</li>
          <li>• CSV files should include columns: conversation_id, role, content</li>
          <li>• JSON files should contain arrays of trace objects with the same fields</li>
          <li>• Quality scores are calculated based on data completeness and structure</li>
          <li>• Files are automatically validated and processed in the background</li>
        </ul>
      </Card>
    </div>
  );
}