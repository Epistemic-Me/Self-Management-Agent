describe('Evaluation Page', () => {
  it('should display conversation list and allow selection', () => {
    cy.visit('/evaluation')
    
    // Check that the page loads
    cy.contains('Conversation Dataset').should('be.visible')
    
    // Check that conversations are loaded (assuming there are some)
    cy.get('[data-testid="conversation-list"]').should('exist')
    
    // Check that radar chart container exists when a conversation is selected
    cy.get('[data-testid="conversation-item"]').first().click()
    cy.get('[data-testid="radar-chart"]').should('exist')
  })
}) 