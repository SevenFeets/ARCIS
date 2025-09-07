/// <reference types="cypress" />

// https://on.cypress.io/custom-commands


// Custom commands for ARCIS testing
declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>
            loginAsTestUser(): Chainable<void>
            waitForApiResponse(): Chainable<void>
            checkDashboardElements(): Chainable<void>
        }
    }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/')
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-submit"]').click()
    cy.url().should('include', '/dashboard')
})

// Login as test user
Cypress.Commands.add('loginAsTestUser', () => {
    cy.login('test@arcis.com', 'testpassword123')
})

// Wait for API response
Cypress.Commands.add('waitForApiResponse', () => {
    cy.intercept('GET', '**/api/**').as('apiCall')
    cy.wait('@apiCall', { timeout: 10000 })
})

// Check dashboard elements
Cypress.Commands.add('checkDashboardElements', () => {
    cy.get('[data-testid="detection-stats"]').should('be.visible')
    cy.get('[data-testid="threat-alerts"]').should('be.visible')
    cy.get('[data-testid="detections-list"]').should('be.visible')
})

export { }
