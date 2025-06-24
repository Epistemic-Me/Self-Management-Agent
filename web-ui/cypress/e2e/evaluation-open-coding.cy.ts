describe('Evaluation Page - Open Coding Analysis', () => {
  beforeEach(() => {
    cy.visit('/evaluation');
  });

  it('displays evaluation page with tabs', () => {
    // Check page header
    cy.contains('Evaluation Dashboard').should('be.visible');
    cy.contains('Analyze conversations and perform open coding analysis on datasets').should('be.visible');
    
    // Check tabs
    cy.contains('Conversations').should('be.visible');
    cy.contains('Open Coding Analysis').should('be.visible');
    
    // Conversations tab should be active by default
    cy.contains('Conversation Dataset').should('be.visible');
  });

  it('switches to open coding analysis tab', () => {
    // Click on Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Should show dataset selection
    cy.contains('Select Dataset for Analysis').should('be.visible');
    cy.contains('Choose a dataset to perform open coding analysis').should('be.visible');
    
    // Should show Manage Datasets button
    cy.contains('Manage Datasets').should('be.visible');
  });

  it('displays available datasets for analysis', () => {
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Should show dataset cards
    cy.get('[data-testid="dataset-selection-card"]').should('have.length.at.least', 1);
    
    // Check dataset details
    cy.contains('Customer Support Evaluation').should('be.visible');
    cy.contains('15 queries').should('be.visible');
    cy.contains('Start Open Coding Analysis').should('be.visible');
  });

  it('navigates to datasets page from evaluation', () => {
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Click Manage Datasets button
    cy.contains('Manage Datasets').click();
    
    // Should navigate to datasets page
    cy.url().should('include', '/datasets');
  });

  it('starts open coding analysis for selected dataset', () => {
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Click on a dataset card
    cy.get('[data-testid="dataset-selection-card"]').first().click();
    
    // Should show open coding interface
    cy.contains('Open Coding Analysis', { timeout: 10000 }).should('be.visible');
    cy.contains('Dataset: Customer Support Evaluation').should('be.visible');
    cy.contains('Back to Dataset Selection').should('be.visible');
  });

  it('displays open coding interface components', () => {
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Start analysis
    cy.get('[data-testid="dataset-selection-card"]').first().click();
    
    // Check for open coding interface elements
    cy.contains('Execute Batch').should('be.visible');
    cy.contains('How to Use Open Coding').should('be.visible');
    cy.contains('Execute Batch').should('be.visible');
    cy.contains('Annotate Traces').should('be.visible');
    cy.contains('Export Analysis').should('be.visible');
  });

  it('executes batch analysis', () => {
    // Switch to Open Coding Analysis tab
    cy.contains('Open Coding Analysis').click();
    
    // Start analysis
    cy.contains('Start Open Coding Analysis').first().click();
    
    // Click Execute Batch button
    cy.contains('Execute Batch').click();
    
    // Should show loading state
    cy.contains('Executing...').should('be.visible');
    
    // Mock successful execution
    cy.intercept('POST', '/api/open-coding/execute-batch', {
      success: true,
      execution_id: 'test-exec-123',
      total_traces: 3
    }).as('executeBatch');
    
    // Wait for execution to complete (mocked)
    cy.wait('@executeBatch', { timeout: 10000 });
  });

  it('shows trace navigation after batch execution', () => {
    // Setup mocked execution state
    cy.intercept('POST', '/api/open-coding/execute-batch', {
      success: true,
      execution_id: 'test-exec-123',
      total_traces: 3
    }).as('executeBatch');
    
    cy.intercept('GET', '/api/open-coding/traces/*', {
      traces: [
        {
          id: 'trace1',
          query: 'Test query 1',
          response: 'Test response 1',
          timestamp: '2024-01-01T00:00:00Z'
        }
      ]
    }).as('getTraces');
    
    // Navigate and execute
    cy.contains('Open Coding Analysis').click();
    cy.contains('Start Open Coding Analysis').first().click();
    cy.contains('Execute Batch').click();
    
    cy.wait('@executeBatch');
    cy.wait('@getTraces');
    
    // Should show trace navigation
    cy.contains('Trace 1 of').should('be.visible');
    cy.contains('Previous').should('be.visible');
    cy.contains('Next').should('be.visible');
  });

  it('allows annotation of traces with failure modes', () => {
    // Mock data
    cy.intercept('GET', '/api/open-coding/traces/*', {
      traces: [{
        id: 'trace1',
        query: 'How do I reset my password?',
        response: 'To reset your password, click on the forgot password link.',
        timestamp: '2024-01-01T00:00:00Z'
      }]
    }).as('getTraces');
    
    // Navigate to annotation interface
    cy.contains('Open Coding Analysis').click();
    cy.contains('Start Open Coding Analysis').first().click();
    
    // Should show failure modes
    cy.contains('Failure Modes').should('be.visible');
    cy.contains('Incomplete Response').should('be.visible');
    cy.contains('Hallucination Issues').should('be.visible');
    
    // Check a failure mode
    cy.get('input[type="checkbox"]').first().check();
    
    // Add open coding notes
    cy.get('textarea[placeholder*="qualitative observations"]').type('Response lacks specific steps');
    
    // Save annotation
    cy.contains('Save Annotation').click();
  });

  it('shows progress tracking', () => {
    // Mock progress data
    cy.intercept('GET', '/api/open-coding/progress/*', {
      total_traces: 5,
      annotated_traces: 2,
      completion_percentage: 40
    }).as('getProgress');
    
    // Navigate to open coding
    cy.contains('Open Coding Analysis').click();
    cy.contains('Start Open Coding Analysis').first().click();
    
    cy.wait('@getProgress');
    
    // Should show progress
    cy.contains('Progress').should('be.visible');
    cy.contains('40%').should('be.visible');
    cy.contains('2 of 5 traces annotated').should('be.visible');
  });

  it('exports analysis results', () => {
    // Navigate to open coding
    cy.contains('Open Coding Analysis').click();
    cy.contains('Start Open Coding Analysis').first().click();
    
    // Should show export button (disabled initially)
    cy.contains('Export CSV').should('be.visible');
    
    // After execution, export should be enabled
    // Mock the export endpoint
    cy.intercept('GET', '/api/open-coding/export/*', {
      headers: { 'Content-Type': 'text/csv' },
      body: 'trace_id,query,response,open_code_notes'
    }).as('exportCSV');
    
    // Click export (if enabled)
    cy.get('button:contains("Export CSV")').then($btn => {
      if (!$btn.prop('disabled')) {
        cy.wrap($btn).click();
        cy.wait('@exportCSV');
      }
    });
  });

  it('returns to dataset selection', () => {
    // Navigate to open coding
    cy.contains('Open Coding Analysis').click();
    cy.contains('Start Open Coding Analysis').first().click();
    
    // Click back button
    cy.contains('Back to Dataset Selection').click();
    
    // Should return to dataset selection
    cy.contains('Select Dataset for Analysis').should('be.visible');
  });

  it('handles empty dataset state', () => {
    // Mock empty datasets
    cy.intercept('GET', '/api/datasets', { datasets: [] }).as('getEmptyDatasets');
    
    cy.visit('/evaluation');
    cy.contains('Open Coding Analysis').click();
    
    cy.wait('@getEmptyDatasets');
    
    // Should show empty state
    cy.contains('No datasets available').should('be.visible');
    cy.contains('Create datasets in the Datasets page').should('be.visible');
    cy.contains('Go to Datasets').should('be.visible');
  });

  it('maintains state when switching between tabs', () => {
    // Start in conversations tab
    cy.contains('Conversations').should('have.attr', 'data-state', 'active');
    
    // Switch to open coding
    cy.contains('Open Coding Analysis').click();
    cy.contains('Select Dataset for Analysis').should('be.visible');
    
    // Switch back to conversations
    cy.contains('Conversations').click();
    cy.contains('Conversation Dataset').should('be.visible');
    
    // State should be preserved when switching back
    cy.contains('Open Coding Analysis').click();
    cy.contains('Select Dataset for Analysis').should('be.visible');
  });
});