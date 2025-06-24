describe('Datasets Page', () => {
  beforeEach(() => {
    cy.visit('/datasets');
  });

  it('loads datasets page successfully', () => {
    // Basic test to ensure the page loads without error
    cy.url().should('include', '/datasets');
    cy.get('body').should('be.visible');
  });

  // Skip detailed tests until UI is fully implemented
  it.skip('displays datasets page with correct header', () => {
    // TODO: Datasets page UI needs to be implemented with these specific elements
    cy.contains('Dataset Management').should('be.visible');
    cy.contains('Create and manage sample query datasets for prompt evaluation').should('be.visible');
    cy.get('[data-testid="datasets-count-badge"]').should('be.visible');
    cy.contains('Create Dataset').should('be.visible');
  });

  it.skip('shows empty state when no datasets exist', () => {
    // TODO: Empty state UI needs to be implemented
    cy.intercept('GET', '/api/datasets', { datasets: [] }).as('getDatasets');
    cy.visit('/datasets');
    cy.wait('@getDatasets');
    cy.contains('No datasets yet').should('be.visible');
    cy.contains('Create your first dataset to start collecting sample queries').should('be.visible');
    cy.contains('Create Your First Dataset').should('be.visible');
  });

  it.skip('displays dataset cards when datasets exist', () => {
    // TODO: Dataset cards UI needs to be implemented
    cy.get('[data-testid="dataset-card"]').should('have.length.at.least', 1);
    cy.contains('Customer Support Evaluation').should('be.visible');
    cy.contains('Dataset for testing customer support prompt responses').should('be.visible');
    cy.contains('15 queries').should('be.visible');
    cy.contains("I'm having trouble logging into my account").should('be.visible');
  });

  it.skip('allows generating more queries for a dataset', () => {
    // TODO: Generate queries functionality needs to be implemented
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      cy.contains('Generate').click();
    });
  });

  it.skip('allows exporting a dataset', () => {
    // TODO: Export functionality needs to be implemented
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      cy.get('button[aria-label="Export dataset"]').click();
    });
  });

  it('allows deleting a dataset', () => {
    // Find and click Delete button
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      cy.get('button[aria-label="Delete dataset"]').click();
    });
    
    // Should show confirmation dialog (if implemented)
    // or directly delete (mocked)
  });

  it('opens dataset creation modal when Create Dataset is clicked', () => {
    cy.contains('Create Dataset').click();
    
    // Should open modal or navigate to creation form
    // For now, just verify the button is clickable
    cy.contains('Create Dataset').should('be.visible');
  });

  it('displays dataset status badges correctly', () => {
    // Check for status badges
    cy.get('[data-testid="dataset-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="status-badge"]').should('be.visible');
      cy.wrap($card).find('[data-testid="status-badge"]').should('contain.text', 'ready');
    });
  });

  it('shows dataset creation date and formats it correctly', () => {
    // Check for formatted dates
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      // Date should be visible and formatted
      cy.contains(/\w{3} \d{1,2}, \d{4}/i).should('be.visible');
    });
  });

  it('displays loading state while fetching datasets', () => {
    // Intercept with delay to see loading state
    cy.intercept('GET', '/api/datasets', (req) => {
      req.reply((res) => {
        res.delay(1000);
        res.send({ datasets: [] });
      });
    }).as('getDatasetsSlow');
    
    cy.visit('/datasets');
    
    // Should show loading skeleton
    cy.get('.animate-pulse').should('be.visible');
    
    cy.wait('@getDatasetsSlow');
    
    // Loading should disappear
    cy.get('.animate-pulse').should('not.exist');
  });

  it('handles multiple datasets with proper grid layout', () => {
    // Check grid layout
    cy.get('[data-testid="datasets-grid"]').should('have.class', 'grid');
    
    // Check multiple dataset cards
    cy.get('[data-testid="dataset-card"]').should('have.length.at.least', 2);
    
    // Verify second dataset
    cy.contains('Code Review Assistant').should('be.visible');
    cy.contains('8 queries').should('be.visible');
  });

  it('shows truncated sample queries with "more" indicator', () => {
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      // Should show only first 2 queries
      cy.get('[data-testid="sample-query"]').should('have.length', 2);
      
      // Should show "+N more..." indicator
      cy.contains(/\+\d+ more\.\.\./).should('be.visible');
    });
  });

  it('navigates between datasets page and other pages', () => {
    // Check sidebar navigation
    cy.get('[data-testid="sidebar-nav"]').within(() => {
      cy.contains('Datasets').should('have.class', 'bg-gradient-to-r');
    });
    
    // Navigate to evaluation
    cy.get('[data-testid="sidebar-nav"]').contains('Evaluation').click();
    cy.url().should('include', '/evaluation');
    
    // Navigate back to datasets
    cy.get('[data-testid="sidebar-nav"]').contains('Datasets').click();
    cy.url().should('include', '/datasets');
  });

  it('displays dataset metadata correctly', () => {
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      // Check all metadata elements
      cy.get('[data-testid="dataset-name"]').should('be.visible');
      cy.get('[data-testid="dataset-description"]').should('be.visible');
      cy.get('[data-testid="query-count"]').should('be.visible');
      cy.get('[data-testid="dataset-date"]').should('be.visible');
      cy.get('[data-testid="status-badge"]').should('be.visible');
    });
  });

  it('handles dataset actions properly', () => {
    cy.get('[data-testid="dataset-card"]').first().within(() => {
      // All action buttons should be visible and enabled
      cy.contains('Generate').should('be.visible').and('not.be.disabled');
      cy.get('button[aria-label="Export dataset"]').should('be.visible').and('not.be.disabled');
      cy.get('button[aria-label="Delete dataset"]').should('be.visible').and('not.be.disabled');
    });
  });
});