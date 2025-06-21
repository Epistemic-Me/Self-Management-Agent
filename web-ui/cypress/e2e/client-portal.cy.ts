describe('Client Portal E2E Tests', () => {
  beforeEach(() => {
    // Visit the client portal page
    cy.visit('/client-portal');
  });

  it('should load the client portal successfully', () => {
    cy.get('h1').should('contain', 'Client Portal');
    cy.get('p').should('contain', 'Track your project progress and coordinate with stakeholders');
  });

  it('should display the phase badge correctly', () => {
    cy.get('[data-testid="phase-badge"]').should('be.visible');
    cy.contains('Phase 2 Active').should('be.visible');
  });

  it('should navigate between tabs', () => {
    // Test Overview tab (default)
    cy.get('[role="tab"][aria-selected="true"]').should('contain', 'Overview');
    cy.contains('Active Milestones').should('be.visible');

    // Test Progress tab
    cy.get('[role="tab"]').contains('Progress').click();
    cy.contains('Project Progress').should('be.visible');

    // Test Stakeholders tab
    cy.get('[role="tab"]').contains('Stakeholders').click();
    cy.contains('Project Stakeholders').should('be.visible');

    // Test Phases tab
    cy.get('[role="tab"]').contains('Phases').click();
    cy.contains('Engagement Phases').should('be.visible');
  });

  it('should display progress tracking components', () => {
    // Should show progress tracker in overview
    cy.contains('Project Progress').should('be.visible');
    cy.contains('Overall Progress').should('be.visible');
    cy.contains('Engagement Phases').should('be.visible');
    
    // Should show percentage progress
    cy.get('[role="progressbar"]').should('be.visible');
  });

  it('should display stakeholder management', () => {
    // Navigate to stakeholders tab
    cy.get('[role="tab"]').contains('Stakeholders').click();
    
    // Should show stakeholder tabs
    cy.contains('Active').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('Inactive').should('be.visible');

    // Should show invite button for Developer role
    cy.get('button').contains('Invite').should('be.visible');
  });

  it('should show phase navigation', () => {
    // Navigate to phases tab
    cy.get('[role="tab"]').contains('Phases').click();
    
    // Should show phase cards
    cy.contains('Phase 1:').should('be.visible');
    cy.contains('Phase 2:').should('be.visible');
    
    // Should show navigation buttons
    cy.get('button').contains('Previous Phase').should('be.visible');
    cy.get('button').contains('Next Phase').should('be.visible');
  });

  it('should handle stakeholder invite interaction', () => {
    // Navigate to stakeholders tab
    cy.get('[role="tab"]').contains('Stakeholders').click();
    
    // Click invite button
    cy.get('button').contains('Invite').click();
    
    // Should log the interaction (check console in real implementation)
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });
  });

  it('should display milestone information', () => {
    // In overview tab, should show active milestones
    cy.contains('Active Milestones').should('be.visible');
    
    // Should show milestone cards if any exist
    // This would depend on mock data
  });

  it('should be responsive and accessible', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('h1').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('h1').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('h1').should('be.visible');
  });

  it('should handle loading states gracefully', () => {
    // Intercept API calls to simulate loading
    cy.intercept('GET', '**/api/project/**', { delay: 2000, body: {} });
    
    cy.visit('/client-portal');
    
    // Should show loading state
    cy.contains('Loading client portal...').should('be.visible');
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

  it('should maintain consistent styling with SDK Dashboard', () => {
    // Should use consistent color scheme
    cy.get('[data-testid="sidebar"]').should('have.class', 'bg-card');
    
    // Should use consistent typography
    cy.get('h1').should('have.class', 'text-3xl');
  });

  it('should capture screenshots for documentation', () => {
    // Overview tab screenshot
    cy.screenshot('client-portal-overview', { capture: 'viewport' });
    
    // Progress tab screenshot
    cy.get('[role="tab"]').contains('Progress').click();
    cy.screenshot('client-portal-progress', { capture: 'viewport' });
    
    // Stakeholders tab screenshot
    cy.get('[role="tab"]').contains('Stakeholders').click();
    cy.screenshot('client-portal-stakeholders', { capture: 'viewport' });
    
    // Phases tab screenshot
    cy.get('[role="tab"]').contains('Phases').click();
    cy.screenshot('client-portal-phases', { capture: 'viewport' });
  });
});