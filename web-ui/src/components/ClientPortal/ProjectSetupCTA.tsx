'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, FileText, Users, Target, Calendar, ArrowRight } from 'lucide-react';

interface ProjectSetupCTAProps {
  className?: string;
}

export function ProjectSetupCTA({ className = "" }: ProjectSetupCTAProps) {
  const router = useRouter();

  const handleStartSetup = () => {
    router.push('/project-setup');
  };

  const setupSteps = [
    {
      icon: FileText,
      title: 'Project Information',
      description: 'Define your project name, description, and basic configuration'
    },
    {
      icon: Calendar,
      title: 'Timeline & Planning',
      description: 'Set project timeline and key milestones'
    },
    {
      icon: Users,
      title: 'Team Setup',
      description: 'Add team members and define their roles'
    },
    {
      icon: Target,
      title: 'Requirements',
      description: 'Define objectives and success criteria'
    },
    {
      icon: Rocket,
      title: 'AI Configuration',
      description: 'Configure and test your AI assistant'
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl">
            <Rocket className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Epistemic Me
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Let's set up your first project to get started with AI-powered belief system analysis and dialectical conversations.
        </p>
        <Button 
          onClick={handleStartSetup}
          size="lg"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 text-lg shadow-lg shadow-cyan-500/25"
        >
          Start Project Setup
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Setup Steps Preview */}
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          What we'll set up together
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Setup takes about 5-10 minutes and can be saved and resumed at any time.
          </p>
        </div>
      </Card>

      {/* Benefits Section */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          What you'll get after setup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6">
            <div className="text-center">
              <div className="p-3 bg-purple-500/20 rounded-full inline-block mb-4">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Project Tracking</h4>
              <p className="text-slate-300 text-sm">
                Monitor progress through structured phases and milestones
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-6">
            <div className="text-center">
              <div className="p-3 bg-blue-500/20 rounded-full inline-block mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Team Collaboration</h4>
              <p className="text-slate-300 text-sm">
                Coordinate with stakeholders and track team contributions
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6">
            <div className="text-center">
              <div className="p-3 bg-green-500/20 rounded-full inline-block mb-4">
                <Rocket className="h-6 w-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">AI Assistant</h4>
              <p className="text-slate-300 text-sm">
                Custom-configured AI for belief analysis and conversations
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}