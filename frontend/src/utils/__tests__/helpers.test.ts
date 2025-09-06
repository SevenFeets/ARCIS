// Create utility functions to test
export const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
};

export const calculateThreatLevel = (confidence: number): string => {
    if (confidence >= 0.9) return 'Critical';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
};

export const validateApiKey = (apiKey: string): boolean => {
    return Boolean(apiKey && apiKey.length > 0 && apiKey !== 'undefined');
};

export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

describe('Utility Functions', () => {
    describe('JEST-009: Date/Time Formatting', () => {
        it('should format timestamps correctly', () => {
            const timestamp = '2024-12-08T10:30:45Z';
            const formatted = formatTimestamp(timestamp);

            expect(formatted).toBeTruthy();
            expect(typeof formatted).toBe('string');
            expect(formatted).toContain('12/8/2024'); // Adjust based on locale
        });

        it('should handle invalid timestamps', () => {
            expect(() => formatTimestamp('invalid-date')).not.toThrow();
            const result = formatTimestamp('invalid-date');
            expect(result).toBe('Invalid Date');
        });
    });

    describe('JEST-010: Threat Level Calculation', () => {
        it('should calculate threat levels correctly', () => {
            expect(calculateThreatLevel(0.95)).toBe('Critical');
            expect(calculateThreatLevel(0.85)).toBe('High');
            expect(calculateThreatLevel(0.65)).toBe('Medium');
            expect(calculateThreatLevel(0.35)).toBe('Low');
        });

        it('should handle edge cases', () => {
            expect(calculateThreatLevel(1.0)).toBe('Critical');
            expect(calculateThreatLevel(0.0)).toBe('Low');
            expect(calculateThreatLevel(0.9)).toBe('Critical');
            expect(calculateThreatLevel(0.7)).toBe('High');
        });
    });

    describe('JEST-011: Input Validation', () => {
        it('should validate API keys correctly', () => {
            expect(validateApiKey('valid-api-key-123')).toBe(true);
            expect(validateApiKey('')).toBe(false);
            expect(validateApiKey('undefined')).toBe(false);
        });

        it('should sanitize user input', () => {
            expect(sanitizeInput('  normal input  ')).toBe('normal input');
            expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
            expect(sanitizeInput('safe input')).toBe('safe input');
        });
    });

    describe('JEST-012: Data Type Validation', () => {
        it('should validate number ranges', () => {
            const isValidConfidence = (value: number): boolean => {
                return value >= 0 && value <= 1;
            };

            expect(isValidConfidence(0.5)).toBe(true);
            expect(isValidConfidence(0.0)).toBe(true);
            expect(isValidConfidence(1.0)).toBe(true);
            expect(isValidConfidence(-0.1)).toBe(false);
            expect(isValidConfidence(1.1)).toBe(false);
        });

        it('should validate string formats', () => {
            const isValidWeaponType = (weaponType: string): boolean => {
                const validTypes = ['Pistol', 'Rifle', 'Knife', 'weapon'];
                return validTypes.includes(weaponType);
            };

            expect(isValidWeaponType('Pistol')).toBe(true);
            expect(isValidWeaponType('InvalidType')).toBe(false);
        });
    });

    describe('JEST-013: Array Operations', () => {
        it('should filter detections by threat level', () => {
            const detections = [
                { id: 1, threat_level: 8, weapon_type: 'Pistol' },
                { id: 2, threat_level: 5, weapon_type: 'Knife' },
                { id: 3, threat_level: 9, weapon_type: 'Rifle' }
            ];

            const highThreatDetections = detections.filter(d => d.threat_level >= 7);
            expect(highThreatDetections).toHaveLength(2);
            expect(highThreatDetections[0].id).toBe(1);
            expect(highThreatDetections[1].id).toBe(3);
        });

        it('should sort detections by timestamp', () => {
            const detections = [
                { id: 1, timestamp: '2024-12-08T10:30:45Z' },
                { id: 2, timestamp: '2024-12-08T09:30:45Z' },
                { id: 3, timestamp: '2024-12-08T11:30:45Z' }
            ];

            const sorted = detections.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            expect(sorted[0].id).toBe(3); // Latest first
            expect(sorted[2].id).toBe(2); // Earliest last
        });
    });
});
