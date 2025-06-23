'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { PromptConfigurationStep } from './PromptConfigurationStep';

// Types for the wizard form data
export interface ProjectFormData {
  projectInfo: {
    name: string;
    description: string;
  };
  timeline: {
    startDate: string;
    estimatedDuration: string;
  };
  stakeholders: {
    projectManager: {
      name: string;
      email: string;
    };
    teamMembers: Array<{
      name: string;
      email: string;
      role: 'SME' | 'Developer' | 'Analyst';
    }>;
  };
  requirements: {
    objectives: string[];
    constraints: string[];
    success_criteria: string[];
  };
  integration: {
    githubRepo: string;
    apiEndpoints: string[];
    notifications: {
      email: boolean;
      slack: boolean;
      teams: boolean;
    };
  };
  promptConfiguration: {
    systemPrompt: string;
    description: string;
    version: string;
  };
}

interface ProjectSetupWizardProps {
  onComplete: (data: ProjectFormData) => void;
  onSave?: (data: Partial<ProjectFormData>) => void;
  initialData?: Partial<ProjectFormData>;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Project Information',
    description: 'Basic project details and configuration'
  },
  {
    id: 2,
    title: 'Timeline & Milestones',
    description: 'Project schedule and key deliverables'
  },
  {
    id: 3,
    title: 'Team & Stakeholders',
    description: 'Team member setup and role assignments'
  },
  {
    id: 4,
    title: 'Requirements',
    description: 'Project objectives and success criteria'
  },
  {
    id: 5,
    title: 'Prompt Configuration',
    description: 'Define and test your AI assistant behavior'
  },
  {
    id: 6,
    title: 'Integration Settings',
    description: 'GitHub integration and notifications'
  }
];

export function ProjectSetupWizard({ onComplete, onSave, initialData }: ProjectSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedProgress, setSavedProgress] = useState<Partial<ProjectFormData>>(initialData || {});
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<ProjectFormData>({
    defaultValues: savedProgress,
    mode: 'onChange'
  });

  const watchedData = watch();

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (onSave && Object.keys(watchedData).length > 0) {
        onSave(watchedData);
        setSavedProgress(watchedData);
        toast({
          title: "Progress saved",
          description: "Your work has been automatically saved.",
          duration: 2000,
        });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [watchedData, onSave, toast]);

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ProjectFormData) => {
    onComplete(data);
    toast({
      title: "Project Created Successfully!",
      description: "Your project has been set up and is ready to use.",
    });
  };

  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Project Setup Wizard</h1>
        <p className="text-gray-400">Set up your new project in 5 simple steps</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center space-x-4 mb-8">
        {WIZARD_STEPS.map((step) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.id < currentStep 
                ? 'bg-green-500 text-white' 
                : step.id === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-600 text-gray-400'
            }`}>
              {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
            </div>
            {step.id < WIZARD_STEPS.length && (
              <div className={`w-12 h-0.5 ml-2 ${
                step.id < currentStep ? 'bg-green-500' : 'bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="p-6">
            {/* Step Content */}
            <div className="space-y-4">
              <div className="border-b border-gray-700 pb-4">
                <h2 className="text-xl font-semibold text-white">
                  {WIZARD_STEPS[currentStep - 1].title}
                </h2>
                <p className="text-gray-400 mt-1">
                  {WIZARD_STEPS[currentStep - 1].description}
                </p>
              </div>

              {/* Step 1: Project Information */}
              {currentStep === 1 && (
                <div className="space-y-4" data-testid="step-project-info">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      {...register('projectInfo.name', { required: 'Project name is required' })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter project name"
                      data-testid="project-name"
                    />
                    {errors.projectInfo?.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.projectInfo.name?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Description *
                    </label>
                    <textarea
                      {...register('projectInfo.description', { required: 'Description is required' })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe your project goals and scope"
                      data-testid="project-description"
                    />
                    {errors.projectInfo?.description && (
                      <p className="text-red-400 text-sm mt-1">{errors.projectInfo.description?.message}</p>
                    )}
                  </div>

                </div>
              )}

              {/* Step 2: Timeline & Milestones */}
              {currentStep === 2 && (
                <div className="space-y-4" data-testid="step-timeline">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        {...register('timeline.startDate', { required: 'Start date is required' })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid="start-date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                      {errors.timeline?.startDate && (
                        <p className="text-red-400 text-sm mt-1">{errors.timeline.startDate?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estimated Duration *
                      </label>
                      <select
                        {...register('timeline.estimatedDuration', { required: 'Duration is required' })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid="duration"
                      >
                        <option value="">Select duration</option>
                        <option value="2-3 weeks">2-3 weeks</option>
                        <option value="1-2 months">1-2 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6+ months">6+ months</option>
                      </select>
                      {errors.timeline?.estimatedDuration && (
                        <p className="text-red-400 text-sm mt-1">{errors.timeline.estimatedDuration?.message}</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Step 3: Team & Stakeholders */}
              {currentStep === 3 && (
                <div className="space-y-4" data-testid="step-stakeholders">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Project Manager</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Name *
                        </label>
                        <input
                          {...register('stakeholders.projectManager.name', { required: 'Project manager name is required' })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Project manager name"
                          data-testid="pm-name"
                        />
                        {errors.stakeholders?.projectManager?.name && (
                          <p className="text-red-400 text-sm mt-1">{errors.stakeholders.projectManager.name?.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          {...register('stakeholders.projectManager.email', { 
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="email@example.com"
                          data-testid="pm-email"
                        />
                        {errors.stakeholders?.projectManager?.email && (
                          <p className="text-red-400 text-sm mt-1">{errors.stakeholders.projectManager.email?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Team Members</h3>
                    <p className="text-sm text-gray-400 mb-2">Add team members (optional)</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      data-testid="add-team-member"
                    >
                      Add Team Member
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Requirements */}
              {currentStep === 4 && (
                <div className="space-y-4" data-testid="step-requirements">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Objectives *
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="List your main project objectives (one per line)"
                      data-testid="objectives"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Constraints & Limitations
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any constraints or limitations to consider"
                      data-testid="constraints"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Success Criteria *
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="How will you measure project success?"
                      data-testid="success-criteria"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Prompt Configuration */}
              {currentStep === 5 && (
                <PromptConfigurationStep
                  systemPrompt={watchedData.promptConfiguration?.systemPrompt || ''}
                  onSystemPromptChange={(prompt) => {
                    setValue('promptConfiguration.systemPrompt', prompt);
                  }}
                  onSave={() => onSave?.(watchedData)}
                  onContinueToEvaluation={() => {
                    // This will be implemented when we add evaluation functionality
                    toast({
                      title: "Ready for Evaluation",
                      description: "Prompt configured! Evaluation features coming soon.",
                    });
                  }}
                />
              )}

              {/* Step 6: Integration Settings */}
              {currentStep === 6 && (
                <div className="space-y-4" data-testid="step-integration">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      GitHub Repository
                    </label>
                    <input
                      {...register('integration.githubRepo')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://github.com/owner/repo"
                      data-testid="github-repo"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'email', label: 'Email notifications' },
                        { key: 'slack', label: 'Slack integration' },
                        { key: 'teams', label: 'Microsoft Teams' }
                      ].map((option) => (
                        <label key={option.key} className="flex items-center">
                          <input
                            type="checkbox"
                            {...register(`integration.notifications.${option.key}` as any)}
                            className="mr-2"
                            data-testid={`notification-${option.key}`}
                          />
                          <span className="text-gray-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Ready to Create Project</h4>
                    <p className="text-gray-300 text-sm">
                      Review your settings and click "Create Project" to complete the setup process.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="prev-button"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave?.(watchedData)}
                  data-testid="save-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>

                {currentStep < WIZARD_STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    data-testid="next-button"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="create-project-button"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}