import { describe, it, expect } from 'vitest';

import {
    SimulationEngine,
    SIMULATION_PHASES
} from '../src/engine/simulation/simulationEngine.js';


function createTestSimulation(contactAvailable) {

    const mission = {

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
                    dataRateMbps: 0
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


    const simulation = new SimulationEngine(mission, 42);

    simulation.start();

    simulation.state.status = SIMULATION_PHASES.PRIMARY_OPS;


    // Force predictable ground-station contact for this test.

    simulation.updateGroundStationContact = () => {

        simulation.state.isContactingGroundStation =
            contactAvailable;

        simulation.state.activeGroundStation =
            contactAvailable ? 'TEST GROUND STATION' : null;
    };


    simulation.step(1);

    return simulation;
}


describe('Communication Power Integration', () => {

    it('should include transmitter power during active ground-station contact', () => {

        const noContactSimulation =
            createTestSimulation(false);

        const contactSimulation =
            createTestSimulation(true);


        const powerWithoutTransmission =
            noContactSimulation.state.currentPowerConsumptionW;

        const powerDuringTransmission =
            contactSimulation.state.currentPowerConsumptionW;


        const expectedAdditionalPowerW =
            65 * (1 - 0.30);


        expect(powerDuringTransmission)
            .toBeGreaterThan(powerWithoutTransmission);


        expect(
            powerDuringTransmission - powerWithoutTransmission
        ).toBeCloseTo(expectedAdditionalPowerW, 4);
    });

});
