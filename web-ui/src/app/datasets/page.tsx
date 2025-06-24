'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Plus, 
  FileText, 
  Calendar, 
  Download,
  Play,
  Trash2,
  Edit3,
  Settings
} from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  description: string;
  created_at: string;
  query_count: number;
  system_prompt: string;
  status: 'ready' | 'generating' | 'error';
  sample_queries: Array<{
    id: string;
    text: string;
  }>;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // For now, simulate loading datasets
      setTimeout(() => {
        setDatasets([
          {
            id: 'dataset_1',
            name: 'Customer Support Evaluation',
            description: 'Dataset for testing customer support prompt responses',
            created_at: '2024-06-23T10:30:00Z',
            query_count: 15,
            system_prompt: 'You are a helpful customer support assistant...',
            status: 'ready',
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
            created_at: '2024-06-22T14:15:00Z',
            query_count: 8,
            system_prompt: 'You are an experienced senior software engineer...',
            status: 'ready',
            sample_queries: [
              { id: 'q4', text: "Please review this function for potential bugs" },
              { id: 'q5', text: "How can I improve the performance of this code?" }
            ]
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load datasets:', error);
      setIsLoading(false);
    }
  };

  const createNewDataset = () => {
    // TODO: Implement dataset creation modal/form
    console.log('Create new dataset');
  };

  const generateMoreQueries = (datasetId: string) => {
    // TODO: Implement AI-powered query generation
    console.log('Generate more queries for dataset:', datasetId);
  };

  const exportDataset = (datasetId: string) => {
    // TODO: Implement dataset export functionality
    console.log('Export dataset:', datasetId);
  };

  const deleteDataset = (datasetId: string) => {
    // TODO: Implement dataset deletion with confirmation
    console.log('Delete dataset:', datasetId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dataset Management</h1>
          <p className="text-slate-400">
            Create and manage <span className="text-cyan-400">sample query datasets</span> for prompt evaluation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
            <Database className="h-4 w-4 mr-2" />
            {datasets.length} Datasets
          </Badge>
          <Button 
            onClick={createNewDataset}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </div>
      </div>

      {/* Dataset Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-700 bg-gray-800/50 backdrop-blur-sm animate-pulse">
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Database className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">No datasets yet</h3>
          <p className="text-center text-slate-400 max-w-md">
            Create your first dataset to start collecting sample queries for prompt evaluation. 
            Datasets help you systematically test your AI prompts across multiple scenarios.
          </p>
          <Button 
            onClick={createNewDataset}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Dataset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <Card key={dataset.id} className="border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/70 transition-colors">
              <div className="p-6">
                {/* Dataset Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{dataset.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{dataset.description}</p>
                  </div>
                  <Badge 
                    className={`ml-2 ${
                      dataset.status === 'ready' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : dataset.status === 'generating'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {dataset.status}
                  </Badge>
                </div>

                {/* Dataset Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {dataset.query_count} queries
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(dataset.created_at)}
                  </div>
                </div>

                {/* Sample Queries Preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-300 mb-2">Sample queries:</p>
                  <div className="space-y-1">
                    {dataset.sample_queries.slice(0, 2).map((query) => (
                      <p key={query.id} className="text-xs text-slate-400 italic truncate">
                        "{query.text}"
                      </p>
                    ))}
                    {dataset.sample_queries.length > 2 && (
                      <p className="text-xs text-slate-500">
                        +{dataset.sample_queries.length - 2} more...
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateMoreQueries(dataset.id)}
                    className="flex-1 text-slate-300 border-slate-600 hover:border-blue-500 hover:text-blue-400"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportDataset(dataset.id)}
                    className="text-slate-300 border-slate-600 hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDataset(dataset.id)}
                    className="text-slate-300 border-slate-600 hover:border-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}