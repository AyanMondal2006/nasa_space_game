import { describe, it, expect } from 'vitest';

import {
    calculateMissionScore
} from '../src/engine/simulation/missionScoring.js';


function createMission() {

    return {

        durationDays: 90,

        budgetLimitUSD: 200_000_000,

        objectives: [
            {
                id: 'primary-objective',
                isPrimary: true
            },
            {
                id: 'secondary-objective',
                isPrimary: false
            }
        ],

        spacecraft: {
            instruments: [
                {
                    id: 'test-instrument',
                    scienceValue: 60
                }
            ]
        }
    };
}


function createSimulationState(overrides = {}) {

    return {

        status: 'COMPLETED',

        totalDataCollectedMB: 100_000,

        totalDataDownlinkedMB: 90_000,

        subsystemHealth: {
            bus: 100,
            power: 100,
            battery: 100,
            instruments: 100,
            comms: 100
        },

        objectivesProgress: {
            'primary-objective': 100,
            'secondary-objective': 0
        },

        ...overrides
    };
}


function createValidationMetrics(overrides = {}) {

    return {

        budget: {
            totalCost: 140_000_000
        },

        power: {
            daylightPowerMarginPercent: 30
        },

        mass: {
            massMarginFraction: 0.20
        },

        ...overrides
    };
}


describe('Mission Scoring Edge Cases', () => {

    it('should reward completion of secondary objectives', () => {

        const mission = createMission();

        const validationMetrics = createValidationMetrics();


        const incompleteScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState({
                objectivesProgress: {
                    'primary-objective': 100,
                    'secondary-objective': 0
                }
            }),

            validationMetrics
        });


        const completedScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState({
                objectivesProgress: {
                    'primary-objective': 100,
                    'secondary-objective': 100
                }
            }),

            validationMetrics
        });


        expect(completedScore.finalScore)
            .toBeGreaterThan(incompleteScore.finalScore);
    });


    it('should not treat zero battery health as 100 percent', () => {

        const mission = createMission();

        const validationMetrics = createValidationMetrics();


        const degradedScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState({
                subsystemHealth: {
                    bus: 100,
                    power: 100,
                    battery: 0,
                    instruments: 100,
                    comms: 100
                }
            }),

            validationMetrics
        });


        const healthyScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState(),

            validationMetrics
        });


        expect(degradedScore.finalScore)
            .toBeLessThan(healthyScore.finalScore);
    });


    it('should not substitute a default power margin when actual margin is zero', () => {

        const mission = createMission();


        const zeroMarginScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState(),

            validationMetrics: createValidationMetrics({
                power: {
                    daylightPowerMarginPercent: 0
                }
            })
        });


        const positiveMarginScore = calculateMissionScore({

            mission,

            simulationState: createSimulationState(),

            validationMetrics: createValidationMetrics({
                power: {
                    daylightPowerMarginPercent: 30
                }
            })
        });


        expect(zeroMarginScore.finalScore)
            .toBeLessThan(positiveMarginScore.finalScore);
    });


    it('should not declare an unfinished mission successful', () => {

        const result = calculateMissionScore({

            mission: createMission(),

            simulationState: createSimulationState({
                status: 'PRIMARY_OPS',

                objectivesProgress: {
                    'primary-objective': 100,
                    'secondary-objective': 100
                }
            }),

            validationMetrics: createValidationMetrics()
        });


        expect(result.isSuccess).toBe(false);
    });


    it('should keep final score within zero and one hundred for negative objective progress', () => {

        const result = calculateMissionScore({

            mission: createMission(),

            simulationState: createSimulationState({
                objectivesProgress: {
                    'primary-objective': -10000,
                    'secondary-objective': 0
                }
            }),

            validationMetrics: createValidationMetrics()
        });


        expect(Number.isFinite(result.finalScore)).toBe(true);

        expect(result.finalScore).toBeGreaterThanOrEqual(0);

        expect(result.finalScore).toBeLessThanOrEqual(100);
    });


    it('should not award maximum budget and design-margin points when validation metrics are missing', () => {

        const result = calculateMissionScore({

            mission: createMission(),

            simulationState: createSimulationState(),

            validationMetrics: null
        });


        expect(result.breakdown.budgetPerformance)
            .toBeLessThan(10);

        expect(result.breakdown.designMargin)
            .toBeLessThan(5);
    });

});
