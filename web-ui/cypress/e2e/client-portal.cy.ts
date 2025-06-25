describe('Client Portal E2E Tests', () => {
  beforeEach(() => {
    // Clear localStorage to ensure clean state
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    // Visit the client portal page
    cy.visit('/client-portal');
  });

  it('should load the client portal successfully', () => {
    // With no project setup, should show CTA
    cy.contains('Welcome to Epistemic Me').should('be.visible');
    cy.contains('Start Project Setup').should('be.visible');
  });

  it('should display Project Setup CTA when no project exists', () => {
    // Should show call-to-action for project setup
    cy.contains('Welcome to Epistemic Me').should('be.visible');
    cy.contains('Start Project Setup').should('be.visible');
    cy.contains('What we\'ll set up together').should('be.visible');
  });

  it('should navigate to project setup when Start Project Setup is clicked', () => {
    // Click the Start Project Setup button
    cy.contains('Start Project Setup').click();
    
    // Should navigate to project setup
    cy.url().should('include', '/project-setup');
    cy.contains('Project Setup Wizard').should('be.visible');
  });

  it('should display project overview when project exists', () => {
    // Mock project data in localStorage
    cy.window().then((win) => {
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
          promptConfiguration: { systemPrompt: 'Test prompt', description: 'Test', version: 'v1.0' }
        },
        setupCompleted: new Date().toISOString()
      };
      win.localStorage.setItem('epistemic_me_project', JSON.stringify(mockProjectData));
    });

    // Reload page to pick up the project data
    cy.reload();

    // Should now show project overview instead of CTA
    cy.contains('Test Project').should('be.visible');
    cy.contains('Setup Complete').should('be.visible');
    cy.contains('2-3 months').should('be.visible');
  });

  it('should not show navigation to Project Setup in sidebar', () => {
    // Project Setup should not be in the main navigation
    cy.get('nav').within(() => {
      cy.contains('Project Setup').should('not.exist');
    });
  });

  it('should integrate with existing SDK Dashboard navigation', () => {
    // Should have client portal in sidebar navigation
    cy.get('nav').within(() => {
      cy.contains('Client Portal').should('be.visible');
    });
    
    // Should be able to navigate to other sections
    cy.get('nav').contains('Chat').should('be.visible');
    cy.get('nav').contains('Evaluation').should('be.visible');
    cy.get('nav').contains('User Workbench').should('be.visible');
  });

  it('should be responsive and accessible', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.contains('Welcome to Epistemic Me').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.contains('Welcome to Epistemic Me').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.contains('Welcome to Epistemic Me').should('be.visible');
  });

  it('should capture screenshots for documentation', () => {
    // Project Setup CTA screenshot
    cy.screenshot('client-portal-setup-cta', { capture: 'viewport' });
    
    // With project data
    cy.window().then((win) => {
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
          promptConfiguration: { systemPrompt: 'Test prompt', description: 'Test', version: 'v1.0' }
        },
        setupCompleted: new Date().toISOString()
      };
      win.localStorage.setItem('epistemic_me_project', JSON.stringify(mockProjectData));
    });
    
    cy.reload();
    cy.screenshot('client-portal-project-overview', { capture: 'viewport' });
  });
});