import { describe, it, expect } from 'vitest';

import {
    validateMission
} from '../src/engine/validation/validateMission.js';


function createTestMission() {

    return {

        destination: 'earth',

        durationDays: 90,

        budgetLimitUSD: 200_000_000,

        orbit: {
            altitudeKm: 705,
            inclinationDeg: 45
        },

        spacecraft: {

            bus: {
                massKg: 120,
                costUSD: 4500000
            },

            power: {
                generationW: 1100,
                massKg: 45,
                costUSD: 3200000,
                isRTG: false
            },

            battery: {
                capacityWh: 1500,
                massKg: 32,
                costUSD: 1400000
            },

            instruments: [
                {
                    id: 'inst-optical-hr',
                    massKg: 42,
                    powerConsumptionW: 95,
                    dataRateMbps: 25,
                    costUSD: 12000000,
                    scienceValue: 40
                }
            ],

            comms: {
                bandwidthMbps: 45,
                powerConsumptionW: 65,
                massKg: 16,
                costUSD: 2800000
            },

            adcs: {
                powerConsumptionW: 42,
                massKg: 24,
                costUSD: 4200000
            },

            computing: {
                powerConsumptionW: 28,
                massKg: 14,
                storageCapacityGB: 128,
                compressionFactor: 0.5,
                costUSD: 5200000
            },

            thermal: {
                powerConsumptionW: 24,
                massKg: 26,
                costUSD: 1800000
            }
        },

        launchVehicle: {
            name: 'Falcon 9',
            payloadCapacityKg: 17500,
            launchCostUSD: 67000000
        },

        objectives: []
    };
}


describe('Mission Validation Edge Cases', () => {

    it('should preserve a valid zero-degree orbital inclination', () => {

        const mission = createTestMission();

        mission.orbit.inclinationDeg = 0;

        const result = validateMission(mission);

        expect(result.metrics.orbit.inclinationDeg).toBe(0);
    });


    it('should allow an adequately powered RTG spacecraft without a battery', () => {

        const mission = createTestMission();

        mission.spacecraft.power = {
            ...mission.spacecraft.power,
            isRTG: true,
            generationW: 1100
        };

        mission.spacecraft.battery = null;

        const result = validateMission(mission);

        expect(result.errors).not.toContainEqual(
            expect.objectContaining({
                title: 'Missing Electrical Energy Storage (Battery)'
            })
        );

        expect(result.isValid).toBe(true);
    });


    it('should return structured errors for a null spacecraft configuration', () => {

        const mission = createTestMission();

        mission.spacecraft = null;

        const validationCall = () => validateMission(mission);

        expect(validationCall).not.toThrow();

        const result = validationCall();

        expect(result.isValid).toBe(false);

        expect(result.errors.length).toBeGreaterThan(0);
    });


    it('should reject a solar-powered spacecraft without a battery', () => {

        const mission = createTestMission();

        mission.spacecraft.battery = null;

        const result = validateMission(mission);

        expect(result.isValid).toBe(false);

        expect(result.errors).toContainEqual(
            expect.objectContaining({
                title: 'Missing Electrical Energy Storage (Battery)'
            })
        );
    });

});
