'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, Mail, Shield, Code, BarChart3, Plus } from 'lucide-react';

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

  const getRoleColor = (role: Stakeholder['role']) => {
    switch (role) {
      case 'SME':
        return 'from-purple-500 to-indigo-500';
      case 'Developer':
        return 'from-blue-500 to-cyan-500';
      case 'Analyst':
        return 'from-green-500 to-emerald-500';
    }
  };

  const getStatusIcon = (status: Stakeholder['status']) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />;
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full" />;
      case 'inactive':
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getRoleDescription = (role: Stakeholder['role']) => {
    switch (role) {
      case 'SME':
        return 'Subject Matter Expert with domain knowledge and evaluation authority';
      case 'Developer':
        return 'Technical implementation and system integration specialist';
      case 'Analyst':
        return 'Data analysis and insights generation specialist';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const activeStakeholders = stakeholders.filter(s => s.status === 'active');
  const pendingStakeholders = stakeholders.filter(s => s.status === 'pending');
  const inactiveStakeholders = stakeholders.filter(s => s.status === 'inactive');

  const handleApproveStakeholder = (id: string) => {
    onUpdateStakeholder?.(id, { status: 'active' });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <span>Stakeholders</span>
        </h2>
        {currentUserRole === 'Developer' && onInviteStakeholder && (
          <Button 
            onClick={onInviteStakeholder}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all duration-300"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 grid w-full grid-cols-3">
          <TabsTrigger 
            value="active" 
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300 rounded-lg flex items-center space-x-2"
          >
            <span>Active</span>
            <Badge className="bg-white/20 text-white border-0 text-xs px-2 py-0.5">
              {activeStakeholders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all duration-300 rounded-lg flex items-center space-x-2"
          >
            <span>Pending</span>
            <Badge className="bg-white/20 text-white border-0 text-xs px-2 py-0.5">
              {pendingStakeholders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="inactive" 
            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white transition-all duration-300 rounded-lg flex items-center space-x-2"
          >
            <span>Inactive</span>
            <Badge className="bg-white/20 text-white border-0 text-xs px-2 py-0.5">
              {inactiveStakeholders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeStakeholders.map((stakeholder) => (
            <div key={stakeholder.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(stakeholder.role)} text-white font-semibold`}>
                      {getInitials(stakeholder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white/10 rounded-full p-1 backdrop-blur-sm">
                    {getStatusIcon(stakeholder.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">{stakeholder.name}</h3>
                    <Badge className={`bg-gradient-to-r ${getRoleColor(stakeholder.role)} text-white border-0 text-xs px-2 py-1`}>
                      {getRoleIcon(stakeholder.role)}
                      <span className="ml-1">{stakeholder.role}</span>
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm truncate">{stakeholder.email}</p>
                  {stakeholder.lastActivity && (
                    <p className="text-slate-500 text-xs mt-1">Last active {stakeholder.lastActivity}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingStakeholders.map((stakeholder) => (
            <div key={stakeholder.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(stakeholder.role)} text-white font-semibold opacity-60`}>
                      {getInitials(stakeholder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white/10 rounded-full p-1 backdrop-blur-sm">
                    {getStatusIcon(stakeholder.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">{stakeholder.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={`bg-gradient-to-r ${getRoleColor(stakeholder.role)} text-white border-0 text-xs px-2 py-1`}>
                        {getRoleIcon(stakeholder.role)}
                        <span className="ml-1">{stakeholder.role}</span>
                      </Badge>
                      {currentUserRole === 'Developer' && (
                        <Button
                          onClick={() => handleApproveStakeholder(stakeholder.id)}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 text-xs px-3 py-1"
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm truncate">{stakeholder.email}</p>
                  <p className="text-yellow-400 text-xs mt-1">Awaiting approval</p>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveStakeholders.map((stakeholder) => (
            <div key={stakeholder.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 opacity-60">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-slate-500 text-white font-semibold">
                      {getInitials(stakeholder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white/10 rounded-full p-1 backdrop-blur-sm">
                    {getStatusIcon(stakeholder.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">{stakeholder.name}</h3>
                    <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 text-xs px-2 py-1">
                      {getRoleIcon(stakeholder.role)}
                      <span className="ml-1">{stakeholder.role}</span>
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm truncate">{stakeholder.email}</p>
                  <p className="text-gray-400 text-xs mt-1">Inactive</p>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Current User Role Info */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
        <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
          {getRoleIcon(currentUserRole)}
          <span>Your Role: {currentUserRole}</span>
        </h3>
        <p className="text-slate-400 text-sm">{getRoleDescription(currentUserRole)}</p>
        {currentUserRole === 'Developer' && (
          <p className="text-blue-400 text-xs mt-2">As a Developer, you can invite and manage stakeholders, configure system settings, and deploy changes.</p>
        )}
      </div>
    </div>
  );
}