/// <reference types="cypress" />

describe('Navigation E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    describe('CYP-005: Main Navigation', () => {
        it('should navigate to all main pages', () => {
            // Test home page
            cy.get('[data-testid="nav-home"]').click()
            cy.url().should('include', '/')
            cy.get('[data-testid="hero-section"]').should('be.visible')

            // Test about page
            cy.get('[data-testid="nav-about"]').click()
            cy.url().should('include', '/about')
            cy.get('[data-testid="about-content"]').should('be.visible')

            // Test contact page
            cy.get('[data-testid="nav-contact"]').click()
            cy.url().should('include', '/contact')
            cy.get('[data-testid="contact-form"]').should('be.visible')

            // Test project overview page
            cy.get('[data-testid="nav-project"]').click()
            cy.url().should('include', '/project')
            cy.get('[data-testid="project-overview"]').should('be.visible')
        })

        it('should highlight active navigation item', () => {
            cy.get('[data-testid="nav-about"]').click()
            cy.get('[data-testid="nav-about"]').should('have.class', 'active')
        })
    })

    describe('CYP-006: Protected Route Access', () => {
        it('should redirect to login for dashboard access', () => {
            cy.visit('/dashboard')
            cy.get('[data-testid="login-modal"]').should('be.visible')
        })

        it('should allow dashboard access after login', () => {
            cy.loginAsTestUser()
            cy.url().should('include', '/dashboard')
            cy.get('[data-testid="dashboard"]').should('be.visible')
        })

        it('should allow profile access after login', () => {
            cy.loginAsTestUser()
            cy.visit('/profile')
            cy.url().should('include', '/profile')
            cy.get('[data-testid="profile-page"]').should('be.visible')
        })
    })

    describe('CYP-007: Responsive Navigation', () => {
        it('should show mobile menu on small screens', () => {
            cy.viewport(768, 1024)
            cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
            cy.get('[data-testid="mobile-menu-button"]').click()
            cy.get('[data-testid="mobile-nav-menu"]').should('be.visible')
        })

        it('should hide mobile menu on large screens', () => {
            cy.viewport(1280, 720)
            cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible')
            cy.get('[data-testid="desktop-nav-menu"]').should('be.visible')
        })
    })

    describe('CYP-008: Breadcrumb Navigation', () => {
        it('should show correct breadcrumbs on nested pages', () => {
            cy.loginAsTestUser()
            cy.visit('/dashboard')
            cy.get('[data-testid="breadcrumb"]').should('contain', 'Dashboard')

            // Navigate to a nested page if exists
            cy.get('[data-testid="detection-details-link"]').first().click()
            cy.get('[data-testid="breadcrumb"]').should('contain', 'Dashboard')
            cy.get('[data-testid="breadcrumb"]').should('contain', 'Detection Details')
        })
    })
})
