describe('User Workbench - Run Simulation', () => {
  beforeEach(() => {
    // Intercept the simulateConversation API call
    cy.intercept('POST', '**/simulateConversation', {
      statusCode: 200,
      body: {
        data: {
          success: true,
          message: 'Simulation queued successfully'
        }
      }
    }).as('simulateConversation')
  })

  it('should run simulation and show toast on success', () => {
    cy.visit('/user-workbench')
    
    // Check that the page loads
    cy.contains('Real Users').should('be.visible')
    
    // Select the first user (assuming mock data exists)
    cy.get('[data-testid="user-item"]').first().click()
    
    // Check that the Run Simulation button is visible
    cy.get('[data-testid="run-simulation-button"]').should('be.visible')
    
    // Click the Run Simulation button
    cy.get('[data-testid="run-simulation-button"]').click()
    
    // Wait for the API call to complete
    cy.wait('@simulateConversation')
    
    // Assert that the toast appears with success message
    cy.contains('Simulation queued').should('be.visible')
  })

  it('should handle simulation failure and show error toast', () => {
    // Intercept with error response
    cy.intercept('POST', '**/simulateConversation', {
      statusCode: 500,
      body: {
        error: 'Internal server error'
      }
    }).as('simulateConversationError')

    cy.visit('/user-workbench')
    
    // Select the first user
    cy.get('[data-testid="user-item"]').first().click()
    
    // Click the Run Simulation button
    cy.get('[data-testid="run-simulation-button"]').click()
    
    // Wait for the API call to complete
    cy.wait('@simulateConversationError')
    
    // Assert that the error toast appears
    cy.contains('Failed to queue simulation').should('be.visible')
  })
}) 