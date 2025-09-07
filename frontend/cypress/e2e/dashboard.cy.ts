/// <reference types="cypress" />

describe('Dashboard E2E Tests', () => {
    beforeEach(() => {
        cy.loginAsTestUser()
        cy.visit('/dashboard')
    })

    describe('CYP-009: Dashboard Loading', () => {
        it('should load dashboard with all components', () => {
            cy.checkDashboardElements()
            cy.get('[data-testid="loading-spinner"]').should('not.exist')
        })

        it('should display detection statistics', () => {
            cy.get('[data-testid="detection-stats"]').should('be.visible')
            cy.get('[data-testid="total-detections"]').should('contain.text', 'Total')
            cy.get('[data-testid="active-threats"]').should('contain.text', 'Active')
            cy.get('[data-testid="threat-level"]').should('contain.text', 'Level')
        })
    })

    describe('CYP-010: Real-time Updates', () => {
        it('should update detection count when new detection arrives', () => {
            // Get initial count
            cy.get('[data-testid="total-detections"]').then(($el) => {
                const initialCount = parseInt($el.text().match(/\d+/)?.[0] || '0')

                // Simulate new detection via API call
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('API_URL')}/detections`,
                    headers: {
                        'X-API-Key': 'test-api-key'
                    },
                    body: {
                        device_id: 'cypress-test-device',
                        timestamp: new Date().toISOString(),
                        object_type: 'weapon',
                        threat_level: 7,
                        confidence: 0.85,
                        bounding_box: { x: 100, y: 150, width: 80, height: 120 }
                    }
                })

                // Check if count updated
                cy.get('[data-testid="total-detections"]').should('contain', (initialCount + 1).toString())
            })
        })

        it('should show real-time threat alerts', () => {
            cy.get('[data-testid="threat-alerts"]').should('be.visible')
            cy.get('[data-testid="alert-item"]').should('have.length.greaterThan', 0)
        })
    })

    describe('CYP-011: Detection Filtering', () => {
        it('should filter detections by weapon type', () => {
            cy.get('[data-testid="weapon-filter"]').select('Pistol')
            cy.get('[data-testid="detection-item"]').each(($el) => {
                cy.wrap($el).should('contain', 'Pistol')
            })
        })

        it('should filter detections by date range', () => {
            const today = new Date().toISOString().split('T')[0]
            cy.get('[data-testid="date-from"]').type(today)
            cy.get('[data-testid="date-to"]').type(today)
            cy.get('[data-testid="apply-filter"]').click()

            cy.get('[data-testid="detection-item"]').should('have.length.greaterThan', 0)
        })

        it('should filter detections by threat level', () => {
            cy.get('[data-testid="threat-level-filter"]').select('High')
            cy.get('[data-testid="detection-item"]').each(($el) => {
                cy.wrap($el).find('[data-testid="threat-level"]').should('contain', 'High')
            })
        })
    })

    describe('CYP-012: Detection Details Modal', () => {
        it('should open detection details modal', () => {
            cy.get('[data-testid="detection-item"]').first().click()
            cy.get('[data-testid="detection-modal"]').should('be.visible')
            cy.get('[data-testid="detection-image"]').should('be.visible')
            cy.get('[data-testid="detection-metadata"]').should('be.visible')
        })

        it('should display detection frame image', () => {
            cy.get('[data-testid="detection-item"]').first().click()
            cy.get('[data-testid="detection-image"]').should('be.visible')
            cy.get('[data-testid="detection-image"]').should('have.attr', 'src').and('not.be.empty')
        })

        it('should close modal with close button', () => {
            cy.get('[data-testid="detection-item"]').first().click()
            cy.get('[data-testid="modal-close"]').click()
            cy.get('[data-testid="detection-modal"]').should('not.exist')
        })
    })
})
