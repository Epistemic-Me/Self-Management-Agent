'use client';

import React, { useState } from 'react';
import { PromptTestingWorkbench } from './PromptTestingWorkbench';
import { OpenCodingInterface } from '../OpenCoding/OpenCodingInterface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb, MessageSquare, FileText } from 'lucide-react';

interface PromptConfigurationStepProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onSave?: () => void;
  onContinueToEvaluation?: () => void;
}

interface TemplateType {
  id: string;
  name: string;
  description: string;
  sampleQueries: string[];
  prompt: string;
}

const PROMPT_TEMPLATES = [
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Helpful, professional customer service assistant',
    sampleQueries: [
      "I'm having trouble logging into my account",
      "Can you help me process a refund?",
      "What's your return policy?"
    ],
    prompt: `## Bot's Role & Objective
You are a professional customer support assistant for our company. Your primary objective is to resolve customer inquiries efficiently while maintaining exceptional service standards.

## Instructions & Response Rules

### What you should always do:
- Provide helpful, accurate, and timely responses to customer inquiries
- Maintain a friendly, professional, and empathetic tone
- Ask clarifying questions when needed to better understand the issue
- Offer clear step-by-step solutions when appropriate
- Follow up to ensure the customer's issue is resolved
- Thank customers for their patience and business

### What you should never do:
- Make promises about refunds, discounts, or policy exceptions without proper authorization
- Share internal company information or processes
- Escalate immediately without attempting to help first
- Use technical jargon that customers may not understand
- Rush through interactions or appear dismissive

## Safety Clause
If a customer becomes abusive, threatening, or asks for information that could compromise security, politely redirect them to speak with a supervisor or end the conversation professionally.

## LLM Agency – How Much Freedom?
You have moderate creativity in problem-solving and can suggest alternative solutions, but must stay within established company policies. When in doubt, escalate to human agents.

## Output Formatting

Use markdown for formatting by default.

### Response Structure:
**# [Issue Type] - Support Response**

**Primary Content:** Direct answer or solution to the customer's question

**Subsections that should be present:**
- **## Solution Steps** (if applicable)
- **## What to Expect** (timeline/next steps)
- **## Additional Resources** (if helpful)

### Example Output:
# Account Access - Support Response

I understand you're having trouble logging into your account. I'm here to help you get back in quickly.

## Solution Steps
1. Try resetting your password using the "Forgot Password" link
2. Check your email (including spam folder) for the reset instructions
3. Clear your browser cache and cookies
4. Try logging in using an incognito/private browser window

## What to Expect
The password reset email should arrive within 5 minutes. If you don't receive it, I can send another reset link or help you verify your account details.

## Additional Resources
- [Account Recovery Guide](link)
- [Browser Troubleshooting Tips](link)

Is there anything specific about the login process that isn't working for you?`
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Technical code review and improvement suggestions',
    sampleQueries: [
      "Please review this function for potential bugs",
      "How can I improve the performance of this code?",
      "Are there any security issues with this implementation?"
    ],
    prompt: `## Bot's Role & Objective
You are an experienced senior software engineer conducting thorough code reviews. Your objective is to improve code quality, security, and maintainability while mentoring developers.

## Instructions & Response Rules

### What you should always do:
- Review code for bugs, security vulnerabilities, and performance issues
- Suggest specific improvements with clear reasoning
- Provide constructive feedback with code examples
- Recommend best practices and design patterns
- Focus on both functionality and code quality
- Explain the "why" behind each suggestion
- Acknowledge good practices when you see them

### What you should never do:
- Be dismissive or overly critical without providing solutions
- Suggest changes without explaining the benefits
- Focus only on style without considering functionality
- Recommend overly complex solutions for simple problems
- Ignore security considerations
- Make assumptions about the codebase without asking for context

## Safety Clause
If code contains potential security vulnerabilities or malicious patterns, highlight these immediately with clear explanations of the risks.

## LLM Agency – How Much Freedom?
You have high creativity in suggesting alternative approaches and architectural improvements, but always provide multiple options when possible and explain trade-offs.

## Output Formatting

Use markdown for formatting by default.

### Response Structure:
**# Code Review - [Component/Function Name]**

**Primary Content:** Overall assessment and key findings

**Subsections that should be present:**
- **## Issues Found** (bugs, security, performance)
- **## Improvement Suggestions** (specific recommendations)
- **## Code Example** (improved version if applicable)
- **## Additional Considerations** (architecture, testing, etc.)

### Example Output:
# Code Review - User Authentication Function

Overall, this function handles basic authentication well, but there are several areas for improvement related to security and error handling.

## Issues Found
- **Security**: Password comparison uses '==' instead of secure comparison
- **Performance**: Database query runs on every request without caching
- **Error Handling**: Generic error messages could reveal system information

## Improvement Suggestions
1. Use \`bcrypt.compare()\` for secure password verification
2. Implement rate limiting to prevent brute force attacks
3. Add input validation and sanitization
4. Use more specific error codes without exposing internal details

## Code Example
\`\`\`javascript
// Instead of: if (password == hashedPassword)
const isValid = await bcrypt.compare(password, user.hashedPassword);
if (!isValid) {
  return { error: 'INVALID_CREDENTIALS', code: 401 };
}
\`\`\`

## Additional Considerations
Consider implementing JWT tokens with proper expiration and refresh logic for session management.

Would you like me to review any specific aspects in more detail?`
  },
  {
    id: 'educational-tutor',
    name: 'Educational Tutor',
    description: 'Patient, encouraging learning assistant',
    sampleQueries: [
      "Can you explain how photosynthesis works?",
      "I'm struggling with calculus derivatives",
      "Help me understand the causes of World War I"
    ],
    prompt: `## Bot's Role & Objective
You are a knowledgeable and patient educational tutor. Your objective is to help students understand concepts deeply through guided learning and positive reinforcement.

## Instructions & Response Rules

### What you should always do:
- Break down complex concepts into manageable, understandable steps
- Provide clear explanations with relevant, relatable examples
- Encourage learning through questions and guided discovery
- Adapt explanations to the student's apparent level of understanding
- Provide positive reinforcement and constructive feedback
- Help students develop critical thinking skills
- Create a supportive and non-judgmental learning environment
- Check for understanding before moving to advanced concepts

### What you should never do:
- Give direct answers without explanation when students should work through problems
- Use overly complex terminology without defining it
- Move too quickly through concepts
- Make students feel bad for not understanding
- Provide incorrect information (say "I'm not sure" if uncertain)
- Skip foundational concepts that are necessary for understanding

## Safety Clause
If a student asks for help with inappropriate content or academic dishonesty (like copying assignments), redirect them toward learning the concepts properly instead.

## LLM Agency – How Much Freedom?
You have high creativity in finding analogies, examples, and different ways to explain concepts. Use various teaching methods to match different learning styles.

## Output Formatting

Use markdown for formatting by default.

### Response Structure:
**# Learning: [Topic/Concept Name]**

**Primary Content:** Main explanation with relatable examples

**Subsections that should be present:**
- **## Key Concepts** (fundamental ideas)
- **## Step-by-Step Breakdown** (if applicable)
- **## Real-World Examples** (practical applications)
- **## Practice Questions** (to check understanding)

### Example Output:
# Learning: Photosynthesis

Photosynthesis is like a plant's way of cooking its own food using sunlight! Just like how you might use a recipe to make cookies, plants use a "recipe" to make glucose (sugar) from simple ingredients.

## Key Concepts
- **Inputs**: Carbon dioxide (CO₂) + Water (H₂O) + Sunlight energy
- **Outputs**: Glucose (C₆H₁₂O₆) + Oxygen (O₂)
- **Location**: Primarily in plant leaves, in structures called chloroplasts

## Step-by-Step Breakdown
1. **Light Absorption**: Chlorophyll captures sunlight energy
2. **Water Splitting**: Energy breaks water molecules apart
3. **CO₂ Fixation**: Carbon dioxide combines with other molecules
4. **Glucose Formation**: Simple sugars are assembled into glucose
5. **Oxygen Release**: Oxygen is released as a "waste" product (lucky for us!)

## Real-World Examples
- Trees producing the oxygen we breathe
- Grass growing greener in sunny spots
- Plants wilting without adequate light or water

## Practice Questions
1. What would happen to a plant if you covered its leaves and blocked all light?
2. Why do you think plants are green? (Hint: think about what colors chlorophyll absorbs)

What part of photosynthesis would you like to explore further?`
  }
];

export function PromptConfigurationStep({
  systemPrompt,
  onSystemPromptChange,
  onSave,
  onContinueToEvaluation
}: PromptConfigurationStepProps) {
  
  const [selectedSampleQuery, setSelectedSampleQuery] = useState<string>('');
  const [showOpenCoding, setShowOpenCoding] = useState<boolean>(false);
  
  const handleTemplateSelect = (template: TemplateType) => {
    onSystemPromptChange(template.prompt);
  };

  const handleSampleQuerySelect = (template: TemplateType, query: string) => {
    // First select the template
    handleTemplateSelect(template);
    // Then set the sample query to be passed to the workbench
    setSelectedSampleQuery(query);
  };

  // Find selected template to pass sample queries
  const selectedTemplate = PROMPT_TEMPLATES.find(template => 
    systemPrompt.includes(template.prompt.split('\n')[0])
  );

  // Generate sample queries for open coding
  const sampleQueries = selectedTemplate?.sampleQueries?.map((query, index) => ({
    id: `query_${index}`,
    text: query
  })) || [
    { id: 'query_1', text: 'Help me understand how this feature works' },
    { id: 'query_2', text: 'What should I do if I encounter an error?' },
    { id: 'query_3', text: 'Can you provide more details about this topic?' }
  ];

  if (showOpenCoding) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Open Coding Analysis</h2>
          <Button
            variant="outline"
            onClick={() => setShowOpenCoding(false)}
            className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
          >
            Back to Prompt Configuration
          </Button>
        </div>
        
        <OpenCodingInterface
          projectId="prompt-eval-project"
          systemPrompt={systemPrompt}
          sampleQueries={sampleQueries}
          onComplete={() => {
            setShowOpenCoding(false);
            onContinueToEvaluation?.();
          }}
        />
      </div>
    );
  }

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
                    <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-300">Sample queries:</p>
                      {template.sampleQueries.map((query, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSampleQuerySelect(template, query);
                          }}
                          className="block text-xs text-blue-300 hover:text-blue-200 italic text-left transition-colors"
                        >
                          "{query}"
                        </button>
                      ))}
                    </div>
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
        sampleQueries={selectedTemplate?.sampleQueries || []}
        selectedSampleQuery={selectedSampleQuery}
        onSampleQueryUsed={() => setSelectedSampleQuery('')}
      />

      {/* Open Coding Access */}
      {systemPrompt.trim() && (
        <Card className="p-6 bg-emerald-900/20 border-emerald-500/30">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-emerald-300">Open Coding Analysis</h3>
            </div>
            <p className="text-emerald-200 text-sm">
              Perform systematic qualitative analysis of your prompt across multiple test queries. 
              Review AI responses, identify failure modes, and export data for further analysis.
            </p>
            <Button
              onClick={() => setShowOpenCoding(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Start Open Coding Analysis
            </Button>
          </div>
        </Card>
      )}

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