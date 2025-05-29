'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, User, Brain } from 'lucide-react';
import { enqueueSimulation, getUserSelfModel, getUserBeliefSystems } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { ChecklistItemModal } from '@/components/ChecklistItemModal';
import type { ProfileUser, ChecklistItem, SelfModel, BeliefSystem } from '@/lib/api';

interface UserProfilePaneProps {
  user: ProfileUser & { checklist_progress: ChecklistItem[]; completionPercentage: number };
}

export function UserProfilePane({ user }: UserProfilePaneProps) {
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [selfModel, setSelfModel] = useState<SelfModel | null>(null);
  const [beliefSystems, setBeliefSystems] = useState<BeliefSystem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<{
    bucketCode: string;
    title: string;
    status: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const [selfModelData, beliefSystemsData] = await Promise.all([
          getUserSelfModel(user.user_id),
          getUserBeliefSystems(user.user_id)
        ]);
        setSelfModel(selfModelData);
        setBeliefSystems(beliefSystemsData);
      } catch (error) {
        console.error('Failed to load user details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadUserDetails();
  }, [user.user_id]);

  const handleRunSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      await enqueueSimulation(user.user_id, "default");
      toast({
        title: "Simulation queued",
        description: `Simulation started for user ${user.user_id}`,
      });
    } catch (error) {
      console.error('Failed to run simulation:', error);
      toast({
        variant: "destructive",
        title: "Failed to queue simulation",
        description: "There was an error starting the simulation. Please try again.",
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const handleChecklistItemClick = (item: ChecklistItem) => {
    setSelectedChecklistItem({
      bucketCode: item.bucket_code,
      title: formatBucketLabel(item.bucket_code),
      status: item.status
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatBucketLabel = (bucketCode: string) => {
    const labels: Record<string, string> = {
      'health_device': 'Health Device',
      'dd_score': "Don't Die Score",
      'measurements': 'Measurements',
      'capabilities': 'Capabilities',
      'biomarkers': 'Biomarkers',
      'demographics': 'Demographics',
      'protocols': 'Protocols',
    };
    return labels[bucketCode] || bucketCode;
  };

  const getBucketDescription = (bucketCode: string) => {
    const descriptions: Record<string, string> = {
      'health_device': 'Wearable devices and health monitoring tools connected',
      'dd_score': 'Current Don\'t Die score and trend analysis',
      'measurements': 'Physical health measurements and tracking',
      'capabilities': 'Physical and cognitive capability assessments',
      'biomarkers': 'Lab results and biomarker data',
      'demographics': 'Basic demographic and lifestyle information',
      'protocols': 'Health optimization protocols and interventions',
    };
    return descriptions[bucketCode] || 'Onboarding step completion status';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Don't Die User</h2>
              <Badge variant="outline">Bio-Hacker Pro</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>ID: {user.user_id.substring(0, 8)}...</span>
              <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
              <span>DD UID: {user.dontdie_uid.substring(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Onboarding Progress:</span>
              <span className="text-sm font-bold text-blue-600">{user.completionPercentage}%</span>
              <Progress value={user.completionPercentage} className="w-24 h-2" />
            </div>
          </div>
          <Button 
            onClick={handleRunSimulation}
            disabled={isRunningSimulation}
            data-testid="run-simulation-button"
            size="lg"
          >
            {isRunningSimulation ? 'Running...' : 'Run Simulation'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="onboarding" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
            <TabsTrigger value="onboarding">Onboarding Checklist</TabsTrigger>
            <TabsTrigger value="philosophies">Philosophies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="onboarding" className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid gap-4">
              {user.checklist_progress.map((item) => (
                <Card 
                  key={item.bucket_code} 
                  className="transition-colors hover:bg-accent/50 cursor-pointer"
                  onClick={() => handleChecklistItemClick(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <CardTitle className="text-base">{formatBucketLabel(item.bucket_code)}</CardTitle>
                          <CardDescription className="text-xs">
                            {getBucketDescription(item.bucket_code)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(item.status)}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  {item.status === 'completed' && (
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        Completed: {new Date(item.updated_at).toLocaleDateString()}
                        {item.source && ` • Source: ${item.source}`}
                        <div className="text-xs text-blue-600 mt-1">
                          Click to view detailed data →
                        </div>
                      </div>
                    </CardContent>
                  )}
                  {item.status !== 'completed' && (
                    <CardContent className="pt-0">
                      <div className="text-xs text-blue-600">
                        Click to view available data →
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="philosophies" className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-sm text-muted-foreground">Loading philosophies...</div>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Self Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selfModel ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">ID:</span> {selfModel.id?.substring(0, 8)}...
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Created:</span> {selfModel.created_at ? new Date(selfModel.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No self-model data available</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Belief Systems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {beliefSystems.length > 0 ? (
                      <div className="space-y-3">
                        {beliefSystems.map((system, index) => (
                          <div key={system.id || index} className="border-l-2 border-blue-200 pl-3">
                            <div className="font-medium text-sm">{system.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {system.beliefs?.length || 0} beliefs
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No belief systems available</div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedChecklistItem && (
        <ChecklistItemModal
          isOpen={!!selectedChecklistItem}
          onClose={() => setSelectedChecklistItem(null)}
          userId={user.user_id}
          bucketCode={selectedChecklistItem.bucketCode}
          bucketTitle={selectedChecklistItem.title}
          status={selectedChecklistItem.status}
        />
      )}
    </div>
  );
} 