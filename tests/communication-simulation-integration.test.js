import { describe, it, expect } from 'vitest';

import {
    SimulationEngine,
    SIMULATION_PHASES
} from '../src/engine/simulation/simulationEngine.js';


function createCommunicationMission(bandwidthMbps = 45) {

    return {
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
                    dataRateMbps: 0,
                    scienceValue: 40
                }
            ],

            comms: {
                bandwidthMbps,
                powerConsumptionW: 65,
                massKg: 16
            },

            adcs: {
                powerConsumptionW: 42,
                massKg: 24
            },

            computing: {
                powerConsumptionW: 28,
                storageCapacityGB: 128,
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


function createSimulation({
    bandwidthMbps = 45,
    contactAvailable = true
} = {}) {

    const mission = createCommunicationMission(bandwidthMbps);

    const simulation = new SimulationEngine(mission, 42);

    simulation.start();

    simulation.state.status = SIMULATION_PHASES.PRIMARY_OPS;

    // Control contact deterministically for testing.
    simulation.updateGroundStationContact = () => {

        simulation.state.isContactingGroundStation =
            contactAvailable;

        simulation.state.activeGroundStation =
            contactAvailable ? 'TEST GROUND STATION' : null;
    };

    return simulation;
}


describe('Communication and Simulation Integration', () => {

    it('should transmit onboard data during ground-station contact', () => {

        const simulation = createSimulation({
            contactAvailable: true
        });

        simulation.state.onboardStoredDataMB = 100;

        simulation.step(1);

        expect(simulation.state.totalDataDownlinkedMB)
            .toBeGreaterThan(0);

        expect(simulation.state.onboardStoredDataMB)
            .toBeLessThan(100);

        expect(
            simulation.state.onboardStoredDataMB +
            simulation.state.totalDataDownlinkedMB
        ).toBeCloseTo(100, 5);
    });


    it('should preserve onboard data when ground-station contact is unavailable', () => {

        const simulation = createSimulation({
            contactAvailable: false
        });

        simulation.state.onboardStoredDataMB = 100;

        simulation.step(1);

        expect(simulation.state.totalDataDownlinkedMB).toBe(0);

        expect(simulation.state.onboardStoredDataMB).toBe(100);

        expect(simulation.state.currentDownlinkRateMbps).toBe(0);
    });


    it('should never transmit more data than is available onboard', () => {

        const simulation = createSimulation({
            bandwidthMbps: 45,
            contactAvailable: true
        });

        simulation.state.onboardStoredDataMB = 0.001;

        simulation.step(10);

        expect(simulation.state.totalDataDownlinkedMB)
            .toBeCloseTo(0.001, 5);

        expect(simulation.state.onboardStoredDataMB).toBe(0);

        expect(simulation.state.totalDataDownlinkedMB)
            .toBeLessThanOrEqual(0.001);
    });

});
