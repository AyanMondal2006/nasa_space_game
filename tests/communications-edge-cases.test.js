import { describe, it, expect } from 'vitest';

import {
    calculateCommunicationsBudget
} from '../src/engine/calculations/communications.js';


describe('Communications Engine Edge Cases', () => {

    it('should preserve zero communication bandwidth', () => {

        const result = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 0
            },

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 1000

        });

        expect(result.baseBandwidthMbps).toBe(0);

        expect(result.effectiveDownlinkRateMbps).toBe(0);

        expect(result.dailyDownlinkCapacityMB).toBe(0);

        expect(result.status).toBe('critical');
    });


    it('should not invent bandwidth when communication hardware is missing', () => {

        const result = calculateCommunicationsBudget({

            comms: null,

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 1000

        });

        expect(result.baseBandwidthMbps).toBe(0);

        expect(result.effectiveDownlinkRateMbps).toBe(0);

        expect(result.dailyDownlinkCapacityMB).toBe(0);

        expect(result.status).toBe('critical');
    });


    it('should reject negative communication bandwidth', () => {

        const result = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: -10
            },

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 1000

        });

        expect(result.baseBandwidthMbps).toBe(0);

        expect(result.effectiveDownlinkRateMbps).toBe(0);

        expect(result.status).toBe('critical');

        expect(result.issues.length).toBeGreaterThan(0);
    });


    it('should handle zero generated scientific data without a bottleneck', () => {

        const result = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 10
            },

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 0

        });

        expect(result.dailyDownlinkCapacityMB).toBeGreaterThan(0);

        expect(result.status).toBe('optimal');

        expect(result.downlinkMarginPercent).toBe(100);
    });


    it('should detect a communication bottleneck when generated data exceeds capacity', () => {

        const result = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 1
            },

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 1000

        });

        expect(result.dailyDownlinkCapacityMB).toBeLessThan(1000);

        expect(result.netDailyBacklogMB).toBeGreaterThan(0);

        expect(result.status).toBe('critical');
    });


    it('should avoid growing backlog when downlink capacity is sufficient', () => {

        const result = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 10
            },

            bodyId: 'earth',
            altitudeKm: 400,
            dailyDataGeneratedMB: 1000

        });

        expect(result.dailyDownlinkCapacityMB).toBeGreaterThan(1000);

        expect(result.netDailyBacklogMB).toBeLessThan(0);

        expect(result.status).toBe('optimal');
    });


    it('should model a higher Moon downlink rate for optical than RF', () => {

        const rfResult = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 10,
                isOptical: false
            },

            bodyId: 'moon',
            dailyDataGeneratedMB: 1000

        });


        const opticalResult = calculateCommunicationsBudget({

            comms: {
                bandwidthMbps: 10,
                isOptical: true
            },

            bodyId: 'moon',
            dailyDataGeneratedMB: 1000

        });


        expect(opticalResult.effectiveDownlinkRateMbps)
            .toBeGreaterThan(rfResult.effectiveDownlinkRateMbps);
    });

});
