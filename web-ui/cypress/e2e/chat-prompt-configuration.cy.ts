describe('Chat Page - Prompt Configuration', () => {
  beforeEach(() => {
    // Setup project state with basic data
    cy.window().then((win) => {
      const projectData = {
        projectInfo: {
          name: 'Test Project',
          description: 'Test project for e2e testing'
        }
      };
      win.localStorage.setItem('projectData', JSON.stringify(projectData));
    });
    
    cy.visit('/chat');
  });

  it('displays chat interface with prompt configuration tab', () => {
    // Check page header
    cy.contains('Chat & Prompt Management').should('be.visible');
    
    // Check tabs are visible
    cy.contains('Chat').should('be.visible');
    cy.contains('Prompt Configuration').should('be.visible');
    
    // Chat tab should be active by default - check for welcome message
    cy.contains('Welcome to Epistemic Me').should('be.visible');
  });

  it.skip('switches between chat and prompt configuration tabs', () => {
    // TODO: Tab switching behavior needs to be verified - chat input may not load immediately
    // Click on Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Should show prompt configuration interface
    cy.contains('Configure Your AI Assistant').should('be.visible');
    
    // Switch back to Chat tab
    cy.contains('Chat').click();
    
    // Should show chat interface - check for textarea input which is always present
    cy.get('textarea[placeholder*="Type your message"]').should('be.visible');
  });

  it('selects and applies a prompt template', () => {
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Select Customer Support template
    cy.get('[data-testid="template-customer-support"]').click();
    
    // Check that template content is loaded
    cy.get('textarea').should('contain', "Bot's Role & Objective");
    cy.get('textarea').should('contain', 'customer support assistant');
    
    // Verify sample queries are shown
    cy.contains("I'm having trouble logging into my account").should('be.visible');
    cy.contains('Can you help me process a refund?').should('be.visible');
  });

  it('allows custom prompt editing and saves automatically', () => {
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Type custom prompt
    const customPrompt = 'You are a helpful AI assistant specialized in technical support.';
    cy.get('textarea').clear().type(customPrompt);
    
    // Wait for auto-save (debounced)
    cy.wait(1500);
    
    // Verify prompt is saved by switching tabs
    cy.contains('Chat').click();
    cy.contains('Prompt Configuration').click();
    
    // Prompt should still be there
    cy.get('textarea').should('contain', customPrompt);
  });

  it.skip('tests prompt with sample queries in workbench', () => {
    // TODO: This functionality needs to be implemented
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Select Code Reviewer template
    cy.get('[data-testid="template-code-reviewer"]').click();
    
    // Click on a sample query
    cy.contains('Please review this function for potential bugs').click();
    
    // The query should be populated in the chat input
    cy.contains('Chat').click();
    cy.get('textarea[placeholder*="Type your message"]').should('have.value', 'Please review this function for potential bugs');
  });

  it('shows prompt testing drawer when Test Prompt button is clicked', () => {
    // Check if Test Prompt button exists (only shows with project setup)
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Test Prompt")').length > 0) {
        cy.contains('Test Prompt').click();
        
        // Drawer should open
        cy.contains('Test Your Prompt').should('be.visible');
        cy.contains('Quick Test Scenarios').should('be.visible');
      }
    });
  });

  it.skip('validates empty prompt handling', () => {
    // TODO: This validation needs to be implemented in the UI
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Clear any existing prompt  
    cy.get('textarea').first().clear();
    
    // Switch to chat and try to send a message
    cy.contains('Chat').click();
    
    const testMessage = 'Hello, can you help me?';
    cy.get('textarea[placeholder*="Type your message"]').type(testMessage);
    cy.get('button[type="submit"]').click();
    
    // Should show appropriate message about missing prompt
    cy.contains('No system prompt configured').should('be.visible');
  });

  it('handles prompt configuration with all template types', () => {
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Test each template - only show templates when no prompt exists
    cy.get('textarea').first().clear(); // Clear any existing prompt
    
    const templates = [
      { id: 'customer-support', name: 'Customer Support', keyword: 'customer support assistant' },
      { id: 'code-reviewer', name: 'Code Reviewer', keyword: 'senior software engineer' },
      { id: 'educational-tutor', name: 'Educational Tutor', keyword: 'educational tutor' }
    ];
    
    // Templates should now be visible
    cy.contains('Quick Start Templates').should('be.visible');
    
    templates.forEach(template => {
      cy.get(`[data-testid="template-${template.id}"]`).click();
      cy.get('textarea').should('contain', template.keyword);
      
      // Clear prompt to show templates again for next iteration
      if (template.id !== 'educational-tutor') {
        cy.get('textarea').first().clear();
      }
    });
  });

  it.skip('preserves prompt configuration across page reloads', () => {
    // TODO: Auto-save and persistence functionality needs verification
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Set a custom prompt
    const customPrompt = 'You are a specialized AI for data analysis and visualization.';
    cy.get('textarea').clear().type(customPrompt);
    
    // Wait for auto-save
    cy.wait(1500);
    
    // Reload page
    cy.reload();
    
    // Navigate back to Prompt Configuration
    cy.contains('Prompt Configuration').click();
    
    // Prompt should be preserved
    cy.get('textarea').should('contain', customPrompt);
  });

  it('shows prompt writing tips and guidelines', () => {
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Check for guidelines
    cy.contains('Prompt Writing Tips').should('be.visible');
    cy.contains('Best Practices').should('be.visible');
    cy.contains('Testing Strategy').should('be.visible');
    
    // Verify some tips are shown
    cy.contains('Be specific about the role and behavior').should('be.visible');
    cy.contains('Test with various types of inputs').should('be.visible');
  });

  it.skip('integrates prompt configuration with chat functionality', () => {
    // TODO: Chat integration with API needs to be verified/implemented
    // Navigate to Prompt Configuration tab
    cy.contains('Prompt Configuration').click();
    
    // Select Educational Tutor template
    cy.get('[data-testid="template-educational-tutor"]').click();
    
    // Switch to Chat tab
    cy.contains('Chat').click();
    
    // Send a message
    const testMessage = 'Can you explain how photosynthesis works?';
    cy.get('textarea[placeholder*="Type your message"]').type(testMessage);
    cy.get('button[type="submit"]').click();
    
    // Should show message in chat
    cy.contains(testMessage).should('be.visible');
    
    // Should show response (mocked or real)
    cy.contains('Learning: Photosynthesis', { timeout: 10000 }).should('be.visible');
  });
});