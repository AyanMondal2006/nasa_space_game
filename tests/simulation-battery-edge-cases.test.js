import { describe, it, expect } from 'vitest';

import {
  SimulationEngine,
  SIMULATION_PHASES,
} from '../src/engine/simulation/simulationEngine.js';

import { MISSION_CAMPAIGNS } from '../src/data/missions.js';

function createTestMission(batteryCapacityWh, isRTG = false, generationW = 1100) {
  const campaign = MISSION_CAMPAIGNS[0];

  return {
    ...campaign,
    destination: 'earth',
    durationDays: 90,
    orbit: {
      altitudeKm: 705,
      inclinationDeg: 98.2,
    },
    spacecraft: {
      bus: { massKg: 120, costUSD: 4_500_000 },
      power: {
        generationW,
        massKg: 45,
        costUSD: 3_200_000,
        isRTG,
      },
      battery: {
        capacityWh: batteryCapacityWh,
        massKg: batteryCapacityWh > 0 ? 32 : 0,
        costUSD: 1_400_000,
      },
      instruments: [],
      comms: {
        bandwidthMbps: 45,
        powerConsumptionW: 65,
        massKg: 16,
        costUSD: 2_800_000,
      },
      adcs: { powerConsumptionW: 42, massKg: 24, costUSD: 4_200_000 },
      computing: {
        powerConsumptionW: 28,
        massKg: 14,
        storageCapacityGB: 128,
        compressionFactor: 0.5,
        costUSD: 5_200_000,
      },
      thermal: { powerConsumptionW: 24, massKg: 26, costUSD: 1_800_000 },
    },
    launchVehicle: {
      name: 'Falcon 9',
      payloadCapacityKg: 17_500,
      launchCostUSD: 67_000_000,
    },
  };
}

describe('Simulation Battery Edge Cases', () => {
  it('preserves an explicitly configured zero battery capacity', () => {
    const simulation = new SimulationEngine(createTestMission(0));

    expect(simulation.state.batteryCapacityWh).toBe(0);
    expect(simulation.state.batteryEnergyWh).toBe(0);
    expect(simulation.state.batteryPercent).toBe(0);
  });

  it('keeps battery percentage finite when capacity is zero', () => {
    const simulation = new SimulationEngine(createTestMission(1000));

    // Force the zero-capacity edge case to isolate the battery update logic.
    simulation.state.batteryCapacityWh = 0;
    simulation.state.batteryEnergyWh = 0;

    simulation.start();
    simulation.step(60);

    expect(Number.isFinite(simulation.state.batteryPercent)).toBe(true);
    expect(simulation.state.batteryPercent).toBe(0);
  });

  it('does not fail an adequately powered RTG spacecraft without a battery during eclipse', () => {
    const simulation = new SimulationEngine(createTestMission(0, true, 500));

    // Put the spacecraft in primary operations and advance into eclipse.
    simulation.state.status = SIMULATION_PHASES.PRIMARY_OPS;
    simulation.state.orbitAngleRad =
      Math.PI - simulation.orbitCalc.meanMotionRadPerSec * 60;

    simulation.start();
    const state = simulation.step(60);

    expect(state.isInEclipse).toBe(true);
    expect(state.batteryCapacityWh).toBe(0);
    expect(state.batteryPercent).toBe(0);
    expect(state.status).not.toBe(SIMULATION_PHASES.FAILED);
  });

  it('fails a solar-powered spacecraft with no battery when it cannot support eclipse load', () => {
    const simulation = new SimulationEngine(createTestMission(0, false, 1100));

    // Put the spacecraft in primary operations and advance into eclipse.
    simulation.state.status = SIMULATION_PHASES.PRIMARY_OPS;
    simulation.state.orbitAngleRad =
      Math.PI - simulation.orbitCalc.meanMotionRadPerSec * 60;

    simulation.start();
    const state = simulation.step(60);

    expect(state.isInEclipse).toBe(true);
    expect(state.status).toBe(SIMULATION_PHASES.FAILED);
    expect(state.failureReason).toContain('cannot support the current load');
  });
});
