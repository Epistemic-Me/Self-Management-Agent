'use client';

import React from 'react';
import { PromptTestingWorkbench } from './PromptTestingWorkbench';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, MessageSquare } from 'lucide-react';

interface PromptConfigurationStepProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onSave?: () => void;
  onContinueToEvaluation?: () => void;
}

const PROMPT_TEMPLATES = [
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Helpful, professional customer service assistant',
    prompt: `You are a professional customer support assistant. Your role is to:

- Provide helpful, accurate, and timely responses to customer inquiries
- Maintain a friendly, professional, and empathetic tone
- Ask clarifying questions when needed to better understand the issue
- Offer clear step-by-step solutions when appropriate
- Escalate complex issues to human agents when necessary
- Always prioritize customer satisfaction while following company policies

Remember to be patient, understanding, and solution-focused in all interactions.`
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Technical code review and improvement suggestions',
    prompt: `You are an experienced software engineer conducting code reviews. Your role is to:

- Review code for bugs, security issues, and performance problems
- Suggest improvements for code readability and maintainability
- Provide constructive feedback with specific examples
- Recommend best practices and design patterns when appropriate
- Focus on both functionality and code quality
- Be thorough but concise in your feedback
- Always explain the reasoning behind your suggestions

Maintain a collaborative and educational tone in all reviews.`
  },
  {
    id: 'educational-tutor',
    name: 'Educational Tutor',
    description: 'Patient, encouraging learning assistant',
    prompt: `You are a knowledgeable and patient educational tutor. Your role is to:

- Break down complex concepts into understandable steps
- Provide clear explanations with relevant examples
- Encourage learning through questions and guided discovery
- Adapt your teaching style to the student's level of understanding
- Provide positive reinforcement and constructive feedback
- Help students develop critical thinking skills
- Create a supportive and non-judgmental learning environment

Always be encouraging and focus on helping students build confidence in their abilities.`
  }
];

export function PromptConfigurationStep({
  systemPrompt,
  onSystemPromptChange,
  onSave,
  onContinueToEvaluation
}: PromptConfigurationStepProps) {
  
  const handleTemplateSelect = (template: typeof PROMPT_TEMPLATES[0]) => {
    onSystemPromptChange(template.prompt);
  };

  return (
    <div className="space-y-6" data-testid="step-prompt-configuration">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-purple-500/20 rounded-full">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Configure Your AI Assistant</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Define how your AI should behave and test it immediately. This prompt will guide all interactions and can be refined based on evaluation results.
        </p>
      </div>

      {/* Quick Start Templates */}
      {!systemPrompt.trim() && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Quick Start Templates</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Choose a template to get started, or skip to create your own custom prompt.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROMPT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-colors"
                  data-testid={`template-${template.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        Template
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Prompt Testing Workbench */}
      <PromptTestingWorkbench
        systemPrompt={systemPrompt}
        onSystemPromptChange={onSystemPromptChange}
        onSave={onSave}
        onContinueToEvaluation={onContinueToEvaluation}
      />

      {/* Guidelines */}
      <Card className="p-6 bg-blue-900/20 border-blue-500/30">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-300">Prompt Writing Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
            <div>
              <h4 className="font-medium mb-2">✨ Best Practices:</h4>
              <ul className="space-y-1 text-blue-300">
                <li>• Be specific about the role and behavior</li>
                <li>• Include examples of desired responses</li>
                <li>• Set clear boundaries and guidelines</li>
                <li>• Define the tone and style</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🧪 Testing Strategy:</h4>
              <ul className="space-y-1 text-blue-300">
                <li>• Test with various types of inputs</li>
                <li>• Try edge cases and difficult scenarios</li>
                <li>• Verify the tone matches your expectations</li>
                <li>• Check for consistent behavior patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}