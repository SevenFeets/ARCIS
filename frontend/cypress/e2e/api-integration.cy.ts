/// <reference types="cypress" />

describe('API Integration E2E Tests', () => {
    beforeEach(() => {
        cy.loginAsTestUser()
    })

    describe('CYP-013: API Health Check', () => {
        it('should verify API is accessible', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('API_URL')}/health`,
                headers: {
                    'X-API-Key': 'test-api-key'
                }
            }).then((response) => {
                expect(response.status).to.eq(200)
                expect(response.body).to.have.property('status', 'OK')
            })
        })
    })

    describe('CYP-014: Detection API Integration', () => {
        it('should fetch detections from API', () => {
            cy.intercept('GET', '**/api/detections**').as('getDetections')
            cy.visit('/dashboard')
            cy.wait('@getDetections').then((interception) => {
                expect(interception.response?.statusCode).to.eq(200)
                expect(interception.response?.body).to.have.property('active_weapon_threats')
            })
        })

        it('should create new detection via API', () => {
            cy.fixture('testData').then((data) => {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('API_URL')}/detections`,
                    headers: {
                        'X-API-Key': 'test-api-key'
                    },
                    body: data.testDetection
                }).then((response) => {
                    expect(response.status).to.eq(201)
                    expect(response.body).to.have.property('success', true)
                    expect(response.body).to.have.property('detection_id')
                })
            })
        })

        it('should handle API errors gracefully', () => {
            cy.intercept('GET', '**/api/detections**', { statusCode: 500 }).as('apiError')
            cy.visit('/dashboard')
            cy.wait('@apiError')
            cy.get('[data-testid="error-message"]').should('be.visible')
            cy.get('[data-testid="retry-button"]').should('be.visible')
        })
    })

    describe('CYP-015: API Authentication', () => {
        it('should handle missing API key', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('API_URL')}/detections/all`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401)
                expect(response.body).to.have.property('error', 'API key required')
            })
        })

        it('should handle invalid API key', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('API_URL')}/detections/all`,
                headers: {
                    'X-API-Key': 'invalid-key'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401)
            })
        })
    })

    describe('CYP-016: Data Persistence', () => {
        it('should persist detection data across sessions', () => {
            // Create a detection
            cy.fixture('testData').then((data) => {
                const testDetection = {
                    ...data.testDetection,
                    device_id: `cypress-persistence-test-${Date.now()}`
                }

                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('API_URL')}/detections`,
                    headers: {
                        'X-API-Key': 'test-api-key'
                    },
                    body: testDetection
                }).then((response) => {
                    const detectionId = response.body.detection_id

                    // Verify it exists
                    cy.request({
                        method: 'GET',
                        url: `${Cypress.env('API_URL')}/detections/${detectionId}`,
                        headers: {
                            'X-API-Key': 'test-api-key'
                        }
                    }).then((getResponse) => {
                        expect(getResponse.status).to.eq(200)
                        expect(getResponse.body.device_id).to.eq(testDetection.device_id)
                    })
                })
            })
        })
    })
})
