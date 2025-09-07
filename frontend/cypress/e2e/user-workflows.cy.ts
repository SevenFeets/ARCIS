/// <reference types="cypress" />

describe('User Workflows E2E Tests', () => {
    beforeEach(() => {
        cy.loginAsTestUser()
    })

    describe('CYP-017: Complete Detection Review Workflow', () => {
        it('should complete full detection review process', () => {
            // Navigate to dashboard
            cy.visit('/dashboard')
            cy.checkDashboardElements()

            // View detection details
            cy.get('[data-testid="detection-item"]').first().click()
            cy.get('[data-testid="detection-modal"]').should('be.visible')

            // Review detection metadata
            cy.get('[data-testid="detection-metadata"]').should('be.visible')
            cy.get('[data-testid="weapon-type"]').should('not.be.empty')
            cy.get('[data-testid="confidence-score"]').should('not.be.empty')
            cy.get('[data-testid="threat-level"]').should('not.be.empty')

            // Close modal
            cy.get('[data-testid="modal-close"]').click()
            cy.get('[data-testid="detection-modal"]').should('not.exist')
        })
    })

    describe('CYP-018: Manual Detection Entry Workflow', () => {
        it('should create manual detection entry', () => {
            cy.visit('/dashboard')
            cy.get('[data-testid="manual-entry-button"]').click()
            cy.get('[data-testid="manual-entry-modal"]').should('be.visible')

            // Fill form
            cy.get('[data-testid="weapon-type-select"]').select('Pistol')
            cy.get('[data-testid="threat-level-input"]').type('7')
            cy.get('[data-testid="confidence-input"]').type('0.85')
            cy.get('[data-testid="location-input"]').type('Test Location')
            cy.get('[data-testid="description-textarea"]').type('Manual test entry')

            // Submit form
            cy.get('[data-testid="submit-manual-entry"]').click()
            cy.get('[data-testid="success-message"]').should('be.visible')
            cy.get('[data-testid="manual-entry-modal"]').should('not.exist')

            // Verify entry appears in list
            cy.get('[data-testid="detection-item"]').should('contain', 'Manual test entry')
        })
    })

    describe('CYP-019: System Metrics Workflow', () => {
        it('should view system metrics and performance data', () => {
            cy.visit('/dashboard')
            cy.get('[data-testid="system-metrics-button"]').click()
            cy.get('[data-testid="metrics-modal"]').should('be.visible')

            // Check metrics display
            cy.get('[data-testid="cpu-usage"]').should('be.visible')
            cy.get('[data-testid="memory-usage"]').should('be.visible')
            cy.get('[data-testid="network-status"]').should('be.visible')
            cy.get('[data-testid="detection-rate"]').should('be.visible')

            cy.get('[data-testid="close-metrics"]').click()
            cy.get('[data-testid="metrics-modal"]').should('not.exist')
        })
    })

    describe('CYP-020: Search and Filter Workflow', () => {
        it('should search and filter detections effectively', () => {
            cy.visit('/dashboard')

            // Test search functionality
            cy.get('[data-testid="search-input"]').type('pistol')
            cy.get('[data-testid="search-button"]').click()
            cy.get('[data-testid="detection-item"]').should('contain', 'Pistol')

            // Clear search
            cy.get('[data-testid="clear-search"]').click()
            cy.get('[data-testid="search-input"]').should('have.value', '')

            // Test advanced filtering
            cy.get('[data-testid="advanced-filter-toggle"]').click()
            cy.get('[data-testid="filter-panel"]').should('be.visible')

            cy.get('[data-testid="threat-level-min"]').type('5')
            cy.get('[data-testid="confidence-min"]').type('0.8')
            cy.get('[data-testid="apply-filters"]').click()

            // Verify filtered results
            cy.get('[data-testid="detection-item"]').each(($el) => {
                cy.wrap($el).find('[data-testid="threat-level"]').invoke('text').then((text) => {
                    const level = parseInt(text)
                    expect(level).to.be.at.least(5)
                })
            })
        })
    })

    describe('CYP-021: Export and Reporting Workflow', () => {
        it('should export detection data', () => {
            cy.visit('/dashboard')
            cy.get('[data-testid="export-button"]').click()
            cy.get('[data-testid="export-modal"]').should('be.visible')

            // Select export options
            cy.get('[data-testid="export-format"]').select('CSV')
            cy.get('[data-testid="date-range-start"]').type('2024-01-01')
            cy.get('[data-testid="date-range-end"]').type('2024-12-31')

            // Trigger export
            cy.get('[data-testid="confirm-export"]').click()
            cy.get('[data-testid="export-success"]').should('be.visible')
        })
    })

    describe('CYP-022: User Profile Management Workflow', () => {
        it('should update user profile information', () => {
            cy.visit('/profile')
            cy.get('[data-testid="profile-form"]').should('be.visible')

            // Update profile fields
            cy.get('[data-testid="display-name-input"]').clear().type('Updated Test User')
            cy.get('[data-testid="email-input"]').should('be.disabled') // Email usually not editable

            // Update preferences
            cy.get('[data-testid="notification-preferences"]').check()
            cy.get('[data-testid="dark-mode-toggle"]').click()

            // Save changes
            cy.get('[data-testid="save-profile"]').click()
            cy.get('[data-testid="profile-updated"]').should('be.visible')
        })
    })

    describe('CYP-023: Error Recovery Workflow', () => {
        it('should handle and recover from network errors', () => {
            // Simulate network failure
            cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError')

            cy.visit('/dashboard')
            cy.wait('@networkError')

            // Should show error state
            cy.get('[data-testid="network-error"]').should('be.visible')
            cy.get('[data-testid="retry-button"]').should('be.visible')

            // Restore network and retry
            cy.intercept('GET', '**/api/**').as('networkRestored')
            cy.get('[data-testid="retry-button"]').click()

            // Should recover and show data
            cy.wait('@networkRestored')
            cy.checkDashboardElements()
        })
    })

    describe('CYP-024: Mobile Responsive Workflow', () => {
        it('should work correctly on mobile devices', () => {
            cy.viewport(375, 667) // iPhone SE

            cy.visit('/dashboard')

            // Check mobile navigation
            cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
            cy.get('[data-testid="mobile-menu-button"]').click()
            cy.get('[data-testid="mobile-nav-menu"]').should('be.visible')

            // Check mobile dashboard layout
            cy.get('[data-testid="detection-stats"]').should('be.visible')
            cy.get('[data-testid="detections-list"]').should('be.visible')

            // Test mobile detection modal
            cy.get('[data-testid="detection-item"]').first().click()
            cy.get('[data-testid="detection-modal"]').should('be.visible')
            cy.get('[data-testid="detection-image"]').should('be.visible')
        })
    })

    describe('CYP-025: Performance and Load Testing', () => {
        it('should handle large datasets efficiently', () => {
            // Mock large dataset
            cy.intercept('GET', '**/api/detections**', { fixture: 'largeDataset.json' }).as('largeData')

            cy.visit('/dashboard')
            cy.wait('@largeData')

            // Should render without performance issues
            cy.get('[data-testid="detections-list"]').should('be.visible')
            cy.get('[data-testid="detection-item"]').should('have.length.greaterThan', 100)

            // Test pagination or virtual scrolling
            cy.get('[data-testid="pagination"]').should('be.visible')
            cy.get('[data-testid="next-page"]').click()
            cy.get('[data-testid="detection-item"]').should('be.visible')
        })
    })
})
