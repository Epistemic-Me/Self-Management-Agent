'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSetupWizard, ProjectFormData } from '@/components/ProjectSetup/ProjectSetupWizard';
import { 
  createProject, 
  saveProjectDraft, 
  loadProjectDraftLocal, 
  saveProjectDraftLocal, 
  clearProjectDraftLocal 
} from '@/lib/api/project-setup';
import { saveProjectState } from '@/lib/project-state';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function ProjectSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [draftData, setDraftData] = useState<Partial<ProjectFormData> | null>(null);

  // Load any existing draft on component mount
  useEffect(() => {
    const localDraft = loadProjectDraftLocal();
    if (localDraft) {
      setDraftData(localDraft);
      toast({
        title: "Draft loaded",
        description: "Your previous work has been restored.",
      });
    }
  }, [toast]);

  const handleSaveProgress = async (data: Partial<ProjectFormData>) => {
    try {
      // Save to local storage for offline support
      saveProjectDraftLocal(data);
      
      // In a real implementation, you would also save to the server
      // await saveProjectDraft(null, data);
      
      console.log('Progress saved:', data);
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Save failed",
        description: "Could not save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the actual API
      // const project = await createProject(data);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save project data to our state management system
      saveProjectState(data);

      // Clear any saved draft data
      clearProjectDraftLocal();

      toast({
        title: "Project created successfully!",
        description: `${data.projectInfo.name} is now ready to use.`,
      });

      // Redirect to the client portal where the project will now be displayed
      router.push('/client-portal');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Project creation failed",
        description: "Could not create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/client-portal');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="text-xl font-semibold text-white">Creating your project...</h2>
            <p className="text-gray-400">This may take a moment.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="text-gray-400 hover:text-white"
                data-testid="back-to-portal"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Project Setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <ProjectSetupWizard
          onComplete={handleComplete}
          onSave={handleSaveProgress}
          initialData={draftData || undefined}
        />
      </div>
    </div>
  );
}