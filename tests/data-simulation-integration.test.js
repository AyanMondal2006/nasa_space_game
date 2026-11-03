import { describe, it, expect } from 'vitest';

import {
    SimulationEngine,
    SIMULATION_PHASES
} from '../src/engine/simulation/simulationEngine.js';

import {
    MISSION_CAMPAIGNS
} from '../src/data/missions.js';

import {
    calculateDataBudget
} from '../src/engine/calculations/data.js';


function createTestMission({
    dataRateMbps = 8,
    storageCapacityGB = 128
} = {}) {

    const campaign = MISSION_CAMPAIGNS[0];

    return {
        ...campaign,

        destination: 'earth',
        durationDays: 90,

        orbit: {
            altitudeKm: 705,
            inclinationDeg: 98.2
        },

        spacecraft: {

            bus: {
                massKg: 120,
                costUSD: 4500000
            },

            power: {
                generationW: 5000,
                massKg: 45,
                isRTG: false
            },

            battery: {
                capacityWh: 1500,
                massKg: 32
            },

            instruments: [
                {
                    id: 'test-instrument',
                    massKg: 20,
                    powerConsumptionW: 10,
                    dataRateMbps,
                    scienceValue: 40
                }
            ],

            comms: {
                bandwidthMbps: 45,
                powerConsumptionW: 65,
                massKg: 16
            },

            adcs: {
                powerConsumptionW: 42,
                massKg: 24
            },

            computing: {
                powerConsumptionW: 28,
                storageCapacityGB,
                compressionFactor: 0.5
            },

            thermal: {
                powerConsumptionW: 24,
                massKg: 26
            }
        },

        launchVehicle: {
            name: 'Test Launch Vehicle',
            payloadCapacityKg: 17500,
            launchCostUSD: 67000000
        }
    };
}


function createPrimaryOperationsSimulation(mission) {

    const simulation = new SimulationEngine(mission, 42);

    simulation.start();

    // Place the simulation directly into primary operations.
    simulation.state.status = SIMULATION_PHASES.PRIMARY_OPS;

    // Prevent ground-station downlink from affecting
    // data-generation and storage tests.

    simulation.updateGroundStationContact = () => {
        simulation.state.isContactingGroundStation = false;
        simulation.state.activeGroundStation = null;
    };

    return simulation;
}


describe('Data and Simulation Integration', () => {

    it('should apply the configured duty cycle during data generation', () => {

        const mission = createTestMission();

        const simulation = createPrimaryOperationsSimulation(mission);

        const dutyCycleFraction = 0.6;
        const timeStepSeconds = 60;

        const dataBudget = calculateDataBudget({
            instruments: mission.spacecraft.instruments,
            computing: mission.spacecraft.computing,
            dutyCycleFraction
        });

        const expectedGeneratedDataMB =
            dataBudget.effectiveRateMBps *
            timeStepSeconds *
            dutyCycleFraction;

        simulation.step(timeStepSeconds);

        expect(simulation.state.totalDataCollectedMB)
            .toBeCloseTo(expectedGeneratedDataMB, 5);
    });


    it('should preserve explicitly configured zero storage capacity', () => {

        const mission = createTestMission({
            storageCapacityGB: 0
        });

        const simulation = new SimulationEngine(mission, 42);

        expect(simulation.state.maxStorageMB).toBe(0);

        expect(simulation.state.onboardStoredDataMB).toBe(0);
    });


    it('should account for data dropped when onboard storage becomes full', () => {

        const mission = createTestMission({
            dataRateMbps: 100,
            storageCapacityGB: 0.001
        });

        const simulation = createPrimaryOperationsSimulation(mission);

        simulation.step(60);

        expect(simulation.state.totalDataCollectedMB)
            .toBeGreaterThan(simulation.state.maxStorageMB);

        expect(simulation.state.onboardStoredDataMB)
            .toBeCloseTo(simulation.state.maxStorageMB, 5);

        expect(simulation.state.totalDataDroppedMB)
            .toBeCloseTo(
                simulation.state.totalDataCollectedMB -
                simulation.state.onboardStoredDataMB,
                5
            );
    });

});
