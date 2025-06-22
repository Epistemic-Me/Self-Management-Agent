describe('Project Setup Wizard - Screenshot Capture', () => {
  it('captures screenshots of wizard steps', () => {
    cy.visit('/project-setup');
    
    // Step 1: Project Information
    cy.contains('Project Setup Wizard').should('be.visible');
    cy.contains('Step 1 of 5').should('be.visible');
    cy.screenshot('step-1-project-info');
    
    // Fill step 1 and proceed to step 2
    cy.get('[data-testid="project-name"]').type('Demo Project Setup');
    cy.get('[data-testid="project-type"]').select('development');
    cy.get('[data-testid="project-description"]').type('This is a demonstration of the 5-step project setup wizard with auto-save functionality, form validation, and progress tracking.');
    cy.get('[data-testid="priority-high"]').click();
    
    cy.screenshot('step-1-filled');
    
    cy.get('[data-testid="next-button"]').click();
    
    // Step 2: Timeline
    cy.contains('Step 2 of 5').should('be.visible');
    cy.contains('Timeline & Milestones').should('be.visible');
    cy.screenshot('step-2-timeline');
    
    cy.get('[data-testid="start-date"]').type('2024-07-01');
    cy.get('[data-testid="duration"]').select('3-6 months');
    
    cy.screenshot('step-2-filled');
    
    cy.get('[data-testid="next-button"]').click();
    
    // Step 3: Stakeholders
    cy.contains('Step 3 of 5').should('be.visible');
    cy.contains('Team & Stakeholders').should('be.visible');
    cy.screenshot('step-3-stakeholders');
    
    cy.get('[data-testid="pm-name"]').type('Sarah Johnson');
    cy.get('[data-testid="pm-email"]').type('sarah.johnson@company.com');
    
    cy.screenshot('step-3-filled');
    
    cy.get('[data-testid="next-button"]').click();
    
    // Step 4: Requirements
    cy.contains('Step 4 of 5').should('be.visible');
    cy.contains('Requirements').should('be.visible');
    cy.screenshot('step-4-requirements');
    
    cy.get('[data-testid="objectives"]').type('Build scalable web application\nImplement user authentication\nCreate responsive design\nOptimize for performance');
    cy.get('[data-testid="constraints"]').type('6-month timeline\nBudget limitations\nExisting tech stack requirements');
    cy.get('[data-testid="success-criteria"]').type('100% test coverage\nPage load times under 2 seconds\nUser acceptance testing passed\nSecurity audit complete');
    
    cy.screenshot('step-4-filled');
    
    cy.get('[data-testid="next-button"]').click();
    
    // Step 5: Integration
    cy.contains('Step 5 of 5').should('be.visible');
    cy.contains('Integration Settings').should('be.visible');
    cy.screenshot('step-5-integration');
    
    cy.get('[data-testid="github-repo"]').type('https://github.com/company/demo-project');
    cy.get('[data-testid="notification-email"]').check();
    cy.get('[data-testid="notification-slack"]').check();
    
    cy.screenshot('step-5-filled');
    
    // Final screen ready to create
    cy.contains('Ready to Create Project').should('be.visible');
    cy.get('[data-testid="create-project-button"]').should('be.visible');
    cy.screenshot('step-5-ready-to-create');
  });
});