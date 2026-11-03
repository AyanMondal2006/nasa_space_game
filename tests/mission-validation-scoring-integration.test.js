import { describe, it, expect } from 'vitest';

import {
    SimulationEngine,
    SIMULATION_PHASES
} from '../src/engine/simulation/simulationEngine.js';


function createValidationMetrics() {

    return {

        budget: {
            totalCost: 50_000_000
        },

        power: {
            daylightPowerMarginPercent: 40
        },

        mass: {
            massMarginFraction: 0.20
        }
    };
}


function createMission() {

    return {

        durationDays: 90,

        budgetLimitUSD: 100_000_000,

        objectives: [],

        spacecraft: {
            instruments: []
        }
    };
}


function createSimulation(validationMetrics = null) {

    const simulation = new SimulationEngine(
        createMission(),
        42,
        validationMetrics
    );

    simulation.state.status = SIMULATION_PHASES.COMPLETED;

    simulation.state.totalDataCollectedMB = 2000;

    simulation.state.totalDataDownlinkedMB = 2000;

    simulation.state.subsystemHealth = {
        bus: 100,
        power: 100,
        battery: 100,
        instruments: 100,
        comms: 100
    };

    return simulation;
}


describe('Mission Validation and Scoring Integration', () => {

    it('should use actual validation metrics when evaluating the final mission score', () => {

        const simulation = createSimulation(
            createValidationMetrics()
        );

        simulation.evaluateFinalScore();

        expect(simulation.state.score.breakdown.budgetPerformance)
            .toBe(10);

        expect(simulation.state.score.breakdown.designMargin)
            .toBe(5);

        expect(simulation.state.score.breakdown.resourceEfficiency)
            .toBe(15);
    });


    it('should not award budget and mass-margin points when validation evidence is missing', () => {

        const simulation = createSimulation(null);

        simulation.evaluateFinalScore();

        expect(simulation.state.score.breakdown.budgetPerformance)
            .toBe(0);

        expect(simulation.state.score.breakdown.designMargin)
            .toBe(0);
    });

});
