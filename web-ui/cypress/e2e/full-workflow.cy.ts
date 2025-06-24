describe('Full Workflow - Setup to Evaluation', () => {
  beforeEach(() => {
    // Clear any existing state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('completes full workflow from project setup to open coding analysis', () => {
    // Step 1: Complete Project Setup
    cy.visit('/client-portal');
    cy.contains('Start Project Setup').click();
    
    // Fill project information
    cy.get('[data-testid="project-name"]').type('Full Workflow Test Project');
    cy.get('[data-testid="project-description"]').type('Testing the complete workflow from setup through evaluation');
    cy.get('[data-testid="next-button"]').click();
    
    // Timeline
    cy.get('[data-testid="start-date"]').type('2024-06-01');
    cy.get('[data-testid="duration"]').select('3-6 months');
    cy.get('[data-testid="next-button"]').click();
    
    // Stakeholders
    cy.get('[data-testid="pm-name"]').type('Test Manager');
    cy.get('[data-testid="pm-email"]').type('test@example.com');
    cy.get('[data-testid="next-button"]').click();
    
    // Requirements
    cy.get('[data-testid="objectives"]').type('Test project objectives');
    cy.get('[data-testid="success-criteria"]').type('All tests pass');
    cy.get('[data-testid="next-button"]').click();
    
    // Integration Settings
    cy.get('[data-testid="github-repo"]').type('https://github.com/test/repo');
    cy.get('[data-testid="create-project-button"]').click();
    
    // Should redirect to client portal
    cy.url().should('include', '/client-portal');
    cy.contains('Full Workflow Test Project').should('be.visible');
    
    // Step 2: Configure Prompt in Chat Page
    cy.visit('/chat');
    cy.contains('Chat & Prompt Management').should('be.visible');
    
    // Switch to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Select a template
    cy.get('[data-testid="template-customer-support"]').click();
    
    // Verify prompt is loaded
    cy.get('textarea').should('contain', 'customer support assistant');
    
    // Wait for auto-save
    cy.wait(1500);
    
    // Step 3: Visit Datasets Page
    cy.visit('/datasets');
    cy.contains('Dataset Management').should('be.visible');
    
    // Verify datasets exist
    cy.get('[data-testid="dataset-card"]').should('have.length.at.least', 1);
    cy.contains('Customer Support Evaluation').should('be.visible');
    
    // Step 4: Navigate to Evaluation and Start Open Coding
    cy.visit('/evaluation');
    cy.contains('Evaluation Dashboard').should('be.visible');
    
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Select dataset for analysis
    cy.contains('Select Dataset for Analysis').should('be.visible');
    cy.get('[data-testid="dataset-selection-card"]').first().within(() => {
      cy.contains('Start Open Coding Analysis').click();
    });
    
    // Verify open coding interface is displayed
    cy.contains('Open Coding Analysis').should('be.visible');
    cy.contains('Execute Batch').should('be.visible');
    
    // Mock batch execution
    cy.intercept('POST', '/api/open-coding/execute-batch', {
      success: true,
      execution_id: 'workflow-test-123',
      total_traces: 3
    }).as('executeBatch');
    
    cy.intercept('GET', '/api/open-coding/traces/*', {
      traces: [{
        id: 'trace1',
        query: 'Help me with my account',
        response: 'I can help you with your account issue.',
        timestamp: '2024-01-01T00:00:00Z'
      }]
    }).as('getTraces');
    
    // Execute batch
    cy.contains('Execute Batch').click();
    cy.wait('@executeBatch');
    cy.wait('@getTraces');
    
    // Verify trace is displayed
    cy.contains('Help me with my account').should('be.visible');
    cy.contains('Trace 1 of').should('be.visible');
    
    // Add annotation
    cy.get('input[type="checkbox"]').first().check();
    cy.get('textarea[placeholder*="qualitative observations"]').type('Good response structure');
    
    // Verify export button is available
    cy.contains('Export CSV').should('be.visible');
  });

  it('validates data persistence across workflow stages', () => {
    // Setup initial project
    cy.visit('/client-portal');
    cy.contains('Start Project Setup').click();
    
    const projectName = 'Persistence Test Project';
    cy.get('[data-testid="project-name"]').type(projectName);
    cy.get('[data-testid="project-description"]').type('Testing data persistence');
    cy.get('[data-testid="save-button"]').click();
    
    // Navigate away and back
    cy.visit('/chat');
    cy.visit('/client-portal');
    
    // Project should be visible
    cy.contains(projectName).should('be.visible');
    
    // Check prompt configuration persistence
    cy.visit('/chat');
    cy.contains('Prompt Configuration').click();
    
    const customPrompt = 'You are a specialized test assistant.';
    cy.get('textarea').clear().type(customPrompt);
    cy.wait(1500); // Auto-save
    
    // Navigate away and back
    cy.visit('/datasets');
    cy.visit('/chat');
    cy.contains('Prompt Configuration').click();
    
    // Prompt should be preserved
    cy.get('textarea').should('contain', customPrompt);
  });

  it('handles navigation between all pages smoothly', () => {
    // Start at client portal
    cy.visit('/client-portal');
    
    // Navigate through sidebar
    cy.get('[data-testid="sidebar-nav"]').within(() => {
      // Go to Chat
      cy.contains('Chat').click();
    });
    cy.url().should('include', '/chat');
    cy.contains('Chat & Prompt Management').should('be.visible');
    
    // Go to Datasets
    cy.get('[data-testid="sidebar-nav"]').contains('Datasets').click();
    cy.url().should('include', '/datasets');
    cy.contains('Dataset Management').should('be.visible');
    
    // Go to Evaluation
    cy.get('[data-testid="sidebar-nav"]').contains('Evaluation').click();
    cy.url().should('include', '/evaluation');
    cy.contains('Evaluation Dashboard').should('be.visible');
    
    // Back to Client Portal
    cy.get('[data-testid="sidebar-nav"]').contains('Client Portal').click();
    cy.url().should('include', '/client-portal');
  });

  it('validates prompt configuration affects chat behavior', () => {
    // Setup project first
    cy.visit('/client-portal');
    cy.contains('Start Project Setup').click();
    cy.get('[data-testid="project-name"]').type('Chat Test Project');
    cy.get('[data-testid="project-description"]').type('Testing chat with prompt');
    
    // Complete minimal setup
    for (let i = 0; i < 4; i++) {
      cy.get('[data-testid="next-button"]').click();
      // Fill required fields as needed
      if (i === 1) {
        cy.get('[data-testid="start-date"]').type('2024-06-01');
        cy.get('[data-testid="duration"]').select('1-2 months');
      } else if (i === 2) {
        cy.get('[data-testid="pm-name"]').type('Test PM');
        cy.get('[data-testid="pm-email"]').type('pm@test.com');
      } else if (i === 3) {
        cy.get('[data-testid="objectives"]').type('Test objectives');
        cy.get('[data-testid="success-criteria"]').type('Success criteria');
      }
    }
    cy.get('[data-testid="create-project-button"]').click();
    
    // Configure prompt
    cy.visit('/chat');
    cy.contains('Prompt Configuration').click();
    cy.get('[data-testid="template-educational-tutor"]').click();
    cy.wait(1500);
    
    // Test chat with configured prompt
    cy.contains('Chat').click();
    cy.get('input[placeholder*="Type your message"]').type('Explain gravity to me');
    cy.get('button[aria-label="Send message"]').click();
    
    // Should see the message
    cy.contains('Explain gravity to me').should('be.visible');
    
    // Should get a response (mocked or real)
    cy.get('[data-testid="chat-message-assistant"]', { timeout: 10000 }).should('exist');
  });

  it('validates dataset selection flows into evaluation', () => {
    // Go directly to datasets
    cy.visit('/datasets');
    
    // Note dataset names
    cy.contains('Customer Support Evaluation').should('be.visible');
    
    // Go to evaluation
    cy.visit('/evaluation');
    cy.contains('Open Coding Analysis').click();
    
    // Same datasets should be available
    cy.contains('Customer Support Evaluation').should('be.visible');
    
    // Verify dataset metadata matches
    cy.get('[data-testid="dataset-selection-card"]').first().within(() => {
      cy.contains('15 queries').should('be.visible');
      cy.contains('Dataset for testing customer support').should('be.visible');
    });
  });

  it('completes minimal workflow for quick testing', () => {
    // Quick setup - just configure prompt and analyze
    cy.visit('/chat');
    cy.contains('Prompt Configuration').click();
    cy.get('[data-testid="template-code-reviewer"]').click();
    cy.wait(1500);
    
    // Go straight to evaluation
    cy.visit('/evaluation');
    cy.contains('Open Coding Analysis').click();
    
    // Start analysis with existing dataset
    cy.contains('Start Open Coding Analysis').first().click();
    
    // Verify can execute immediately
    cy.contains('Execute Batch').should('be.visible');
    cy.contains('Code Review Assistant').should('be.visible');
  });
});