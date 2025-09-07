/// <reference types="cypress" />

describe('Authentication E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    describe('CYP-001: User Authentication Flow', () => {
        it('should display login modal when accessing protected routes', () => {
            cy.visit('/dashboard')
            cy.get('[data-testid="login-modal"]').should('be.visible')
            cy.get('[data-testid="login-button"]').should('be.visible')
        })

        it('should allow user to login with valid credentials', () => {
            cy.fixture('testData').then((data) => {
                cy.get('[data-testid="login-button"]').click()
                cy.get('[data-testid="email-input"]').type(data.users.testUser.email)
                cy.get('[data-testid="password-input"]').type(data.users.testUser.password)
                cy.get('[data-testid="login-submit"]').click()

                // Should redirect to dashboard after successful login
                cy.url().should('include', '/dashboard')
                cy.get('[data-testid="user-profile"]').should('be.visible')
            })
        })

        it('should show error for invalid credentials', () => {
            cy.get('[data-testid="login-button"]').click()
            cy.get('[data-testid="email-input"]').type('invalid@email.com')
            cy.get('[data-testid="password-input"]').type('wrongpassword')
            cy.get('[data-testid="login-submit"]').click()

            cy.get('[data-testid="error-message"]').should('be.visible')
            cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
        })
    })

    describe('CYP-002: Registration Flow', () => {
        it('should allow new user registration', () => {
            cy.get('[data-testid="register-link"]').click()
            cy.get('[data-testid="register-email"]').type('newuser@test.com')
            cy.get('[data-testid="register-password"]').type('password123')
            cy.get('[data-testid="register-confirm"]').type('password123')
            cy.get('[data-testid="register-submit"]').click()

            cy.get('[data-testid="success-message"]').should('be.visible')
        })

        it('should validate password confirmation', () => {
            cy.get('[data-testid="register-link"]').click()
            cy.get('[data-testid="register-email"]').type('newuser@test.com')
            cy.get('[data-testid="register-password"]').type('password123')
            cy.get('[data-testid="register-confirm"]').type('differentpassword')
            cy.get('[data-testid="register-submit"]').click()

            cy.get('[data-testid="password-mismatch-error"]').should('be.visible')
        })
    })

    describe('CYP-003: Password Reset', () => {
        it('should send password reset email', () => {
            cy.get('[data-testid="login-button"]').click()
            cy.get('[data-testid="forgot-password-link"]').click()
            cy.get('[data-testid="reset-email-input"]').type('test@arcis.com')
            cy.get('[data-testid="send-reset-button"]').click()

            cy.get('[data-testid="reset-email-sent"]').should('be.visible')
        })
    })

    describe('CYP-004: Logout Functionality', () => {
        it('should logout user and redirect to home', () => {
            // First login
            cy.loginAsTestUser()

            // Then logout
            cy.get('[data-testid="user-menu"]').click()
            cy.get('[data-testid="logout-button"]').click()

            cy.url().should('eq', Cypress.config().baseUrl + '/')
            cy.get('[data-testid="login-button"]').should('be.visible')
        })
    })
})
