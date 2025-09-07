
// https://on.cypress.io/configuration

// Import commands.js using ES2015 syntax:
import './commands'
import '@testing-library/cypress/add-commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom error handling for uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
    // Returning false here prevents Cypress from failing the test
    // for certain expected errors (like React dev errors)
    if (err.message.includes('ResizeObserver loop limit exceeded')) {
        return false
    }
    if (err.message.includes('Non-Error promise rejection captured')) {
        return false
    }
    // Let other errors fail the test
    return true
})
