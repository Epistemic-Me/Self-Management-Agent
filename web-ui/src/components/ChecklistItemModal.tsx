'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Activity, Heart, Calendar, TrendingUp, Zap } from 'lucide-react';
import { getChecklistItemData } from '@/lib/api';

interface ChecklistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  bucketCode: string;
  bucketTitle: string;
  status: string;
}

export function ChecklistItemModal({ isOpen, onClose, userId, bucketCode, bucketTitle, status }: ChecklistItemModalProps) {
  const [itemData, setItemData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bucketCode) {
      setLoading(true);
      getChecklistItemData(userId, bucketCode)
        .then(setItemData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, bucketCode, userId]);

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

  const renderDataContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-sm text-muted-foreground">Loading data...</div>
        </div>
      );
    }

    if (!itemData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      );
    }

    // Handle error states
    if (itemData.data.error) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <p className="text-sm font-medium">Data temporarily unavailable</p>
          <p className="text-xs">{itemData.data.error}</p>
        </div>
      );
    }

    // Handle message-only responses (like demographics)
    if (itemData.data.message && !itemData.data.labs && !itemData.data.measurements) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{itemData.data.message}</p>
        </div>
      );
    }

    switch (itemData.type) {
      case 'dd_score':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Current Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{itemData.data.current_score}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{itemData.data.trend}</div>
                <div className="text-xs text-muted-foreground">Source: {itemData.data.source}</div>
                <div className="text-xs text-muted-foreground">Last updated: {itemData.data.last_updated}</div>
              </CardContent>
            </Card>
            {itemData.data.scores && itemData.data.scores.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Recent Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {itemData.data.scores.slice(-5).map((scoreData: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{scoreData.date}</span>
                        <span className="font-medium">{scoreData.score} points</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'measurements':
        if (itemData.data.measurements.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No measurements available</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {itemData.data.measurements.map((measurement: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-3 w-3 text-blue-600" />
                          <div className="text-sm font-medium">{measurement.type.replace('_', ' ')}</div>
                        </div>
                        <div className="text-lg font-bold">{measurement.value} {measurement.unit}</div>
                        {measurement.self_reported && (
                          <div className="text-xs text-orange-600">Self-reported</div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(measurement.date).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'health_device':
        return (
          <div className="space-y-3">
            {itemData.data.devices.map((device: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{device.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{device.type.replace('_', ' ')}</div>
                      {device.source && (
                        <div className="text-xs text-blue-600">via {device.source}</div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={device.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {device.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Last sync: {new Date(device.last_sync).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'biomarkers':
        if (itemData.data.labs.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{itemData.data.message || 'No biomarker data available'}</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {itemData.data.labs.map((lab: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{lab.name}</div>
                    <Badge 
                      variant="outline" 
                      className={
                        lab.status === 'normal' ? 'bg-green-100 text-green-800' :
                        lab.status === 'borderline' ? 'bg-yellow-100 text-yellow-800' :
                        lab.status === 'unknown' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {lab.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold">{lab.value} {lab.unit}</span>
                    {lab.range && <span className="text-muted-foreground">Range: {lab.range}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Date: {new Date(lab.date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'demographics':
        return (
          <div className="space-y-4">
            {itemData.data.message ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{itemData.data.message}</p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    {Object.entries(itemData.data.basic).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</div>
                        <div className="font-medium">{value as string}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Lifestyle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(itemData.data.lifestyle).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-xs font-medium">{value as string}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case 'capabilities':
        return (
          <div className="space-y-4">
            {itemData.data.physical.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Physical Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itemData.data.physical.map((test: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{test.test}</div>
                        <div className="text-sm font-bold">{test.value} {test.unit}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(test.date).toLocaleDateString()}
                        {test.percentile !== 'Unknown' && (
                          <span> • {test.percentile}th percentile</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {itemData.data.cognitive.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Cognitive Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itemData.data.cognitive.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{test.test}</div>
                        <div className="text-xs text-muted-foreground">{test.value} {test.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{test.percentile}th</div>
                        <div className="text-xs text-muted-foreground">percentile</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {itemData.data.physical.length === 0 && itemData.data.cognitive.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No capability assessments available</p>
              </div>
            )}
          </div>
        );

      case 'protocols':
        return (
          <div className="space-y-4">
            {itemData.data.active.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Protocols</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itemData.data.active.map((protocol: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{protocol.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {protocol.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{protocol.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(protocol.start_date).toLocaleDateString()}
                      </div>
                      {protocol.compliance !== 'Unknown' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Compliance: {protocol.compliance}%</span>
                          <Progress value={protocol.compliance} className="w-16 h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {itemData.data.completed.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Completed Protocols</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itemData.data.completed.map((protocol: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium text-sm">{protocol.name}</div>
                      <div className="text-xs text-muted-foreground">{protocol.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Completed: {new Date(protocol.completion_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {itemData.data.active.length === 0 && itemData.data.completed.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No protocols available</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>{itemData.data.message || 'No additional data available'}</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <div>
              <DialogTitle>{bucketTitle}</DialogTitle>
              <DialogDescription>Detailed view of your {bucketTitle.toLowerCase()} data</DialogDescription>
            </div>
            <Badge 
              variant="outline" 
              className={getStatusColor(status)}
            >
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {renderDataContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 