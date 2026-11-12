
import { describe, it, expect } from 'vitest';

import {
  SimulationEngine,
  SIMULATION_PHASES,
} from '../src/engine/simulation/simulationEngine.js';

function createEngine(availableDeltaVMs) {
  const mission = {
    destination: 'earth',
    durationDays: 90,
    deltaVRequiredMs: 100,

    objectives: [
      {
        id: 'insertion',
        type: 'orbital_insertion',
        targetValueDeltaVMs: 90,
      },
    ],

    spacecraft: {
      power: {
        generationW: 5000,
        isRTG: true,
        massKg: 10,
      },

      battery: {
        capacityWh: 1000,
        massKg: 10,
      },

      instruments: [],

      comms: {
        powerConsumptionW: 0,
      },

      adcs: {
        powerConsumptionW: 0,
      },

      computing: {
        powerConsumptionW: 0,
        storageCapacityGB: 1,
      },

      thermal: {
        powerConsumptionW: 0,
      },

      propulsion: {
        initialPropellantKg: 50,
      },
    },
  };

  const validationMetrics = {
    mass: {
      availableDeltaVMs,
      requiredPropellantMassKg: 30,
      configuredPropellantMassKg: 50,
    },
  };

  return new SimulationEngine(
    mission,
    42,
    validationMetrics
  );
}

describe('Orbital Insertion Burn Integration', () => {

  it('should complete insertion when available delta-V is sufficient', () => {
    const engine = createEngine(120);

    const result = engine.executeOrbitalInsertion();

    expect(result).toBe(true);
    expect(engine.state.achievedDeltaVMs).toBe(100);
    expect(engine.state.orbitalInsertionComplete).toBe(true);
    expect(engine.state.orbitalInsertionStatus).toBe('VERIFIED');
  });

  it('should consume the required propellant and calculate the remaining inventory', () => {
    const engine = createEngine(120);

    engine.executeOrbitalInsertion();

    expect(engine.state.propellantConsumedKg).toBe(30);
    expect(engine.state.propellantRemainingKg).toBe(20);
  });

  it('should reject orbital insertion when available delta-V is insufficient', () => {
    const engine = createEngine(70);

    const result = engine.executeOrbitalInsertion();

    expect(result).toBe(false);
    expect(engine.state.achievedDeltaVMs).toBe(70);
    expect(engine.state.orbitalInsertionComplete).toBe(false);
    expect(engine.state.orbitalInsertionStatus).toBe('FAILED');
    expect(engine.state.propellantRemainingKg).toBe(0);

    expect(engine.state.failureReason).toContain(
      'requires 100.0 m/s'
    );
  });

  it('should not award orbital insertion objective progress before a successful burn', () => {
    const engine = createEngine(120);

    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.insertion).toBe(0);

    engine.executeOrbitalInsertion();
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.insertion).toBe(100);
  });

  it('should classify missing validation evidence as unverified', () => {
    const engine = createEngine(null);

    const result = engine.executeOrbitalInsertion();

    expect(result).toBeNull();
    expect(engine.state.achievedDeltaVMs).toBe(0);
    expect(engine.state.orbitalInsertionComplete).toBe(false);
    expect(engine.state.orbitalInsertionStatus).toBe('UNVERIFIED');
  });

  it('should remain in orbital insertion when propulsion evidence is unavailable', () => {
    const engine = createEngine(null);

    engine.state.status = SIMULATION_PHASES.ORBIT_INSERTION;
    engine.state.missionTimeSeconds = 1740;

    engine.start();

    const firstState = engine.step(60);

    expect(firstState.status).toBe(SIMULATION_PHASES.ORBIT_INSERTION);
    expect(firstState.orbitalInsertionComplete).toBe(false);
    expect(firstState.orbitalInsertionStatus).toBe('UNVERIFIED');

    const secondState = engine.step(60);

    expect(secondState.status).toBe(SIMULATION_PHASES.ORBIT_INSERTION);
    expect(secondState.orbitalInsertionComplete).toBe(false);

    const insertionWarnings = secondState.events.filter(
      event =>
        event.severity === 'WARNING' &&
        event.category === 'ORBIT INSERTION'
    );

    expect(insertionWarnings).toHaveLength(1);
  });

  it('should enter commissioning only after verified orbital insertion', () => {
    const engine = createEngine(120);

    engine.state.status = SIMULATION_PHASES.ORBIT_INSERTION;
    engine.state.missionTimeSeconds = 1740;

    engine.start();

    const state = engine.step(60);

    expect(state.orbitalInsertionComplete).toBe(true);
    expect(state.orbitalInsertionStatus).toBe('VERIFIED');
    expect(state.status).toBe(SIMULATION_PHASES.COMMISSIONING);
  });

  it('should fail the mission when a quantified propellant shortage prevents insertion', () => {
    const engine = createEngine(70);

    engine.state.status = SIMULATION_PHASES.ORBIT_INSERTION;
    engine.state.missionTimeSeconds = 1740;

    engine.start();

    const state = engine.step(60);

    expect(state.status).toBe(SIMULATION_PHASES.FAILED);
    expect(state.orbitalInsertionComplete).toBe(false);
    expect(state.orbitalInsertionStatus).toBe('FAILED');

    expect(state.failureReason).toContain(
      'requires 100.0 m/s'
    );
  });

  it('should not report mission completion when insertion remains unverified at the time limit', () => {
    const engine = createEngine(null);

    engine.state.status = SIMULATION_PHASES.ORBIT_INSERTION;
    engine.state.missionTimeSeconds = 1740;
    engine.state.targetDurationSeconds = 1800;

    engine.start();

    const state = engine.step(60);

    expect(state.status).toBe(SIMULATION_PHASES.FAILED);
    expect(state.status).not.toBe(SIMULATION_PHASES.COMPLETED);

    expect(state.failureReason).toContain(
      'Orbital insertion was not verified'
    );
  });

});
