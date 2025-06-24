'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from '@/components/ConversationList';
import { ConversationDetail } from '@/components/ConversationDetail';
import { OpenCodingInterface } from '@/components/OpenCoding/OpenCodingInterface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Settings, Calendar, MessageSquare, FileText, Database } from 'lucide-react';
import type { Conversation } from '@/lib/api';

// Dataset selector component
interface Dataset {
  id: string;
  name: string;
  description: string;
  query_count: number;
  system_prompt: string;
  sample_queries: Array<{ id: string; text: string }>;
}

interface DatasetSelectorProps {
  selectedDataset: string | null;
  onSelectDataset: (datasetId: string) => void;
}

function DatasetSelector({ selectedDataset, onSelectDataset }: DatasetSelectorProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOpenCoding, setShowOpenCoding] = useState(false);
  const [selectedDatasetData, setSelectedDatasetData] = useState<Dataset | null>(null);

  useEffect(() => {
    // TODO: Load datasets from API
    setTimeout(() => {
      setDatasets([
        {
          id: 'dataset_1',
          name: 'Customer Support Evaluation',
          description: 'Dataset for testing customer support prompt responses',
          query_count: 15,
          system_prompt: 'You are a helpful customer support assistant...',
          sample_queries: [
            { id: 'q1', text: "I'm having trouble logging into my account" },
            { id: 'q2', text: "Can you help me process a refund?" },
            { id: 'q3', text: "What's your return policy?" }
          ]
        },
        {
          id: 'dataset_2',
          name: 'Code Review Assistant', 
          description: 'Dataset for evaluating code review and improvement suggestions',
          query_count: 8,
          system_prompt: 'You are an experienced senior software engineer...',
          sample_queries: [
            { id: 'q4', text: "Please review this function for potential bugs" },
            { id: 'q5', text: "How can I improve the performance of this code?" }
          ]
        }
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleStartAnalysis = (dataset: Dataset) => {
    setSelectedDatasetData(dataset);
    setShowOpenCoding(true);
    onSelectDataset(dataset.id);
  };

  if (showOpenCoding && selectedDatasetData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Open Coding Analysis</h2>
            <p className="text-slate-400">Dataset: {selectedDatasetData.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowOpenCoding(false)}
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            Back to Dataset Selection
          </Button>
        </div>
        
        <OpenCodingInterface
          projectId={`dataset_${selectedDatasetData.id}`}
          systemPrompt={selectedDatasetData.system_prompt}
          sampleQueries={selectedDatasetData.sample_queries}
          onComplete={() => setShowOpenCoding(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Select Dataset for Analysis</h2>
          <p className="text-slate-400">Choose a dataset to perform open coding analysis</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/datasets'}
          className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Database className="h-4 w-4 mr-2" />
          Manage Datasets
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border-gray-700 bg-gray-800/50 animate-pulse">
              <div className="p-6">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : datasets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Database className="h-16 w-16 text-slate-400" />
          <h3 className="text-xl font-semibold text-white">No datasets available</h3>
          <p className="text-center text-slate-400 max-w-md">
            Create datasets in the Datasets page to perform open coding analysis.
          </p>
          <Button
            onClick={() => window.location.href = '/datasets'}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          >
            <Database className="h-4 w-4 mr-2" />
            Go to Datasets
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((dataset) => (
            <Card
              key={dataset.id}
              className={`border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/70 transition-colors cursor-pointer ${
                selectedDataset === dataset.id ? 'ring-2 ring-cyan-500' : ''
              }`}
              onClick={() => handleStartAnalysis(dataset)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{dataset.name}</h3>
                    <p className="text-sm text-slate-400">{dataset.description}</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-2">
                    {dataset.query_count} queries
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-slate-300">Sample queries:</p>
                  {dataset.sample_queries.slice(0, 2).map((query) => (
                    <p key={query.id} className="text-xs text-slate-400 italic">
                      "{query.text}"
                    </p>
                  ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartAnalysis(dataset);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Open Coding Analysis
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page header integrated with content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Evaluation Dashboard</h1>
          <p className="text-slate-400">
            Analyze conversations and perform <span className="text-cyan-400">open coding analysis</span> on datasets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Phase 2 Active</span>
          </Badge>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg border-2 border-cyan-400/50">
            <span className="text-white font-bold text-sm">DV</span>
          </div>
        </div>
      </div>

      {/* Tabs for different evaluation types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="open-coding" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Open Coding Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="flex-1 mt-4">
          <div className="flex h-full">
            <div className="w-1/3 border-r border-white/10">
              <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm rounded-t-2xl">
                <h2 className="text-lg font-semibold text-white">Conversation Dataset</h2>
                <p className="text-sm text-slate-400">
                  Developer evaluation view
                </p>
              </div>
              <ConversationList 
                onSelectConversation={setSelectedConversation}
                selectedConversation={selectedConversation}
              />
            </div>
            
            <div className="flex-1">
              {selectedConversation ? (
                <ConversationDetail conversation={selectedConversation} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Select a conversation to view details
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="open-coding" className="flex-1 mt-4">
          <DatasetSelector 
            selectedDataset={selectedDataset}
            onSelectDataset={setSelectedDataset}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 