'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, Mail, Shield, Code, BarChart3 } from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: 'SME' | 'Developer' | 'Analyst';
  status: 'active' | 'pending' | 'inactive';
  lastActivity?: string;
  permissions: string[];
}

interface StakeholderViewProps {
  stakeholders: Stakeholder[];
  currentUserRole: 'SME' | 'Developer' | 'Analyst';
  onInviteStakeholder?: () => void;
  onUpdateStakeholder?: (id: string, updates: Partial<Stakeholder>) => void;
  className?: string;
}

export function StakeholderView({ 
  stakeholders, 
  currentUserRole, 
  onInviteStakeholder,
  onUpdateStakeholder,
  className 
}: StakeholderViewProps) {
  const getRoleIcon = (role: Stakeholder['role']) => {
    switch (role) {
      case 'SME':
        return <Shield className="h-4 w-4" />;
      case 'Developer':
        return <Code className="h-4 w-4" />;
      case 'Analyst':
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Stakeholder['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: Stakeholder['status']) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Users className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleDescription = (role: Stakeholder['role']) => {
    switch (role) {
      case 'SME':
        return 'Subject Matter Expert - provides domain expertise and validation';
      case 'Developer':
        return 'Technical implementation and system integration';
      case 'Analyst':
        return 'Data analysis and performance evaluation';
    }
  };

  const canManageStakeholders = currentUserRole === 'Developer';

  const groupedStakeholders = {
    active: stakeholders.filter(s => s.status === 'active'),
    pending: stakeholders.filter(s => s.status === 'pending'),
    inactive: stakeholders.filter(s => s.status === 'inactive'),
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Project Stakeholders</span>
          </div>
          {canManageStakeholders && (
            <Button onClick={onInviteStakeholder} size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center space-x-2">
              <span>Active</span>
              <Badge variant="secondary" className="ml-1">
                {groupedStakeholders.active.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <span>Pending</span>
              <Badge variant="secondary" className="ml-1">
                {groupedStakeholders.pending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center space-x-2">
              <span>Inactive</span>
              <Badge variant="secondary" className="ml-1">
                {groupedStakeholders.inactive.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {Object.entries(groupedStakeholders).map(([status, statusStakeholders]) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {statusStakeholders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No {status} stakeholders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusStakeholders.map((stakeholder) => (
                    <div
                      key={stakeholder.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {stakeholder.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(stakeholder.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">{stakeholder.name}</p>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              {getRoleIcon(stakeholder.role)}
                              <span>{stakeholder.role}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{stakeholder.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getRoleDescription(stakeholder.role)}
                          </p>
                          {stakeholder.lastActivity && (
                            <p className="text-xs text-muted-foreground">
                              Last active: {stakeholder.lastActivity}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(stakeholder.status)}
                        {canManageStakeholders && stakeholder.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateStakeholder?.(stakeholder.id, { status: 'active' })}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Role-specific information */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Your Role: {currentUserRole}</h4>
          <p className="text-xs text-muted-foreground">
            {getRoleDescription(currentUserRole)}
          </p>
          {currentUserRole === 'Developer' && (
            <p className="text-xs text-muted-foreground mt-2">
              ℹ️ As a Developer, you can invite and manage stakeholders for this project.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}