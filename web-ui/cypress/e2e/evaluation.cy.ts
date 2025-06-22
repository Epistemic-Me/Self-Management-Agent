describe('Evaluation Page', () => {
  it('should display conversation list and allow selection', () => {
    cy.visit('/evaluation')
    
    // Check that the page loads
    cy.contains('Conversation Dataset').should('be.visible')
    
    // Check that conversations are loaded (assuming there are some)
    cy.get('[data-testid="conversation-list"]').should('exist')
    
    // Check that conversation detail pane shows when a conversation is selected
    // Only click if conversation items exist
    cy.get('[data-testid="conversation-item"]').then(($items) => {
      if ($items.length > 0) {
        cy.get('[data-testid="conversation-item"]').first().click()
        // Check that conversation detail is shown (radar chart might not exist if no metrics)
        cy.contains('Conversation Detail').should('be.visible')
      } else {
        // If no conversations, should show appropriate message
        cy.contains('No conversations found').should('be.visible')
      }
    })
  })
}) 