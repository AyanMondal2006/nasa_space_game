import { describe, it, expect } from 'vitest';
import { calculatePowerBudget } from '../src/engine/calculations/power.js';

describe('Power Budget Edge Cases', () => {

    it('should detect critical failure when battery capacity is zero', () => {

        const power = calculatePowerBudget({
            powerSource: {
                generationW: 500
            },

            battery: {
                capacityWh: 0
            },

            computing: {
                powerConsumptionW: 50
            },

            orbit: {
                periodSeconds: 5400,
                maxEclipseDurationSeconds: 2000
            },

            bodyId: 'earth'
        });

        expect(power.totalBatteryCapacityWh).toBe(0);

        expect(power.status).toBe('critical');

        expect(
            power.issues.some(issue =>
                issue.toLowerCase().includes('battery')
            )
        ).toBe(true);
    });

});
