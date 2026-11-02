import { describe, it, expect } from 'vitest';

import {
    calculateDataBudget
} from '../src/engine/calculations/data.js';


describe('Data Management Engine Edge Cases', () => {

    it('should generate zero data when duty cycle is zero', () => {

        const result = calculateDataBudget({

            instruments: [
                { dataRateMbps: 2 }
            ],

            computing: {
                compressionFactor: 0.5,
                storageCapacityGB: 8
            },

            dutyCycleFraction: 0,
            maxContactGapHours: 12

        });

        expect(result.dailyDataVolumeMB).toBe(0);

        expect(result.accumulatedDataInGapMB).toBe(0);
    });


    it('should preserve explicitly configured zero storage capacity', () => {

        const result = calculateDataBudget({

            instruments: [
                { dataRateMbps: 2 }
            ],

            computing: {
                compressionFactor: 0.5,
                storageCapacityGB: 0
            },

            dutyCycleFraction: 0.5,
            maxContactGapHours: 12

        });

        expect(result.storageCapacityGB).toBe(0);

        expect(result.storageCapacityMB).toBe(0);
    });


    it('should use a consistent duty cycle for daily and contact-gap calculations', () => {

        const normal = calculateDataBudget({

            instruments: [
                { dataRateMbps: 2 }
            ],

            computing: {
                compressionFactor: 0.5,
                storageCapacityGB: 100
            },

            dutyCycleFraction: 1,
            maxContactGapHours: 12

        });


        const excessive = calculateDataBudget({

            instruments: [
                { dataRateMbps: 2 }
            ],

            computing: {
                compressionFactor: 0.5,
                storageCapacityGB: 100
            },

            dutyCycleFraction: 1.5,
            maxContactGapHours: 12

        });


        expect(excessive.dailyDataVolumeMB)
            .toBeCloseTo(normal.dailyDataVolumeMB);

        expect(excessive.accumulatedDataInGapMB)
            .toBeCloseTo(normal.accumulatedDataInGapMB);
    });

});
