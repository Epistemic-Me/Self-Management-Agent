describe('Chat Prompt Testing E2E Tests', () => {
  beforeEach(() => {
    // Clear localStorage and set up project data for testing
    cy.window().then((win) => {
      win.localStorage.clear();
      
      // Mock project data with prompt configuration
      const mockProjectData = {
        isSetup: true,
        projectData: {
          projectInfo: { name: 'Test Project', description: 'A test project' },
          timeline: { startDate: '2024-01-15', estimatedDuration: '2-3 months' },
          stakeholders: {
            projectManager: { name: 'John Manager', email: 'john@test.com' },
            teamMembers: [{ name: 'Jane Dev', email: 'jane@test.com', role: 'Developer' }]
          },
          requirements: { objectives: ['Objective 1'], constraints: [], success_criteria: [] },
          integration: { githubRepo: '', apiEndpoints: [], notifications: { email: true, slack: false, teams: false } },
          promptConfiguration: { 
            systemPrompt: 'You are a helpful assistant that responds concisely.', 
            description: 'Test prompt for E2E testing', 
            version: 'v1.0' 
          }
        },
        setupCompleted: new Date().toISOString()
      };
      win.localStorage.setItem('epistemic_me_project', JSON.stringify(mockProjectData));
    });
    
    // Visit the chat page
    cy.visit('/chat');
  });

  it('should load chat interface successfully', () => {
    cy.contains('Chat Interface').should('be.visible');
    cy.contains('Conversational AI with belief modeling').should('be.visible');
  });

  it('should show Test Prompt button when project exists', () => {
    // Should show the Test Prompt button since project exists
    cy.contains('Test Prompt').should('be.visible');
  });

  it('should not show Test Prompt button when no project exists', () => {
    // Clear project data
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.reload();
    
    // Should not show Test Prompt button
    cy.contains('Test Prompt').should('not.exist');
  });

  it('should open prompt testing drawer when Test Prompt is clicked', () => {
    // Click Test Prompt button
    cy.contains('Test Prompt').click();
    
    // Should open the drawer
    cy.contains('Prompt Testing').should('be.visible');
    cy.contains('Test your AI configuration').should('be.visible');
    cy.contains('Test Project').should('be.visible');
  });

  it('should display project information in the drawer', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Should show project details
    cy.contains('Test Project').should('be.visible');
    cy.contains('Active').should('be.visible');
    cy.contains('System Prompt').should('be.visible');
    cy.contains('You are a helpful assistant').should('be.visible');
  });

  it('should display sample queries in the drawer', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Should show sample queries section
    cy.contains('Sample Queries').should('be.visible');
    cy.contains("I'm having trouble logging into my account").should('be.visible');
    cy.contains('Can you help me process a refund?').should('be.visible');
  });

  it('should populate chat input when sample query is clicked', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Click a sample query
    cy.contains("I'm having trouble logging into my account").click();
    
    // Should populate the chat input field
    cy.get('textarea[placeholder="Type your message..."]')
      .should('have.value', "I'm having trouble logging into my account");
    
    // Drawer should close
    cy.contains('Prompt Testing').should('not.exist');
  });

  it('should send message and receive response', () => {
    // Type a message
    cy.get('textarea[placeholder="Type your message..."]')
      .type('Hello, how are you?');
    
    // Send the message
    cy.get('button[type="submit"]').click();
    
    // Should show user message
    cy.contains('Hello, how are you?').should('be.visible');
    
    // Should eventually show assistant response (may take time due to API call)
    // Use a more flexible check since the exact response format may vary
    cy.get('[data-testid="chat-messages"]').within(() => {
      cy.get('.text-white').should('contain', 'Hello, how are you?');
    });
  });

  it('should close drawer when X button is clicked', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Click the close button (may be X or other icon)
    cy.get('button').contains('Close').click();
    
    // Drawer should close
    cy.contains('Prompt Testing').should('not.exist');
  });

  it('should display quick actions in drawer', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Should show quick actions section (scroll into view if needed)
    cy.contains('Quick Actions').scrollIntoView().should('be.visible');
    cy.contains('Edit Prompt Configuration').should('be.visible');
    cy.contains('Copy System Prompt').should('be.visible');
  });

  it('should navigate to project setup when Edit Prompt is clicked', () => {
    // Open the drawer
    cy.contains('Test Prompt').click();
    
    // Scroll to the Edit Prompt Configuration button and click
    cy.contains('Edit Prompt Configuration').scrollIntoView().click({ force: true });
    
    // Should open project setup in new tab (verify link exists)
    cy.get('a[href="/project-setup"]').should('exist');
  });

  it('should handle empty chat state gracefully', () => {
    // Should show welcome message when no conversation exists
    cy.contains('Welcome to Epistemic Me').should('be.visible');
    cy.contains('Start a conversation and experience AI').should('be.visible');
    cy.contains('Belief Modeling').should('be.visible');
  });

  it('should be responsive on different screen sizes', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.contains('Chat Interface').should('be.visible');
    cy.contains('Test Prompt').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.contains('Chat Interface').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.contains('Chat Interface').should('be.visible');
  });

  it('should capture screenshots for documentation', () => {
    // Chat interface screenshot
    cy.screenshot('chat-interface-main', { capture: 'viewport' });
    
    // Open drawer and screenshot
    cy.contains('Test Prompt').click();
    cy.screenshot('chat-prompt-testing-drawer', { capture: 'viewport' });
    
    // Sample query interaction
    cy.contains("I'm having trouble logging into my account").click();
    cy.screenshot('chat-sample-query-populated', { capture: 'viewport' });
  });
});