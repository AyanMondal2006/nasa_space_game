import { describe, it, expect } from 'vitest';
import {
  SimulationEngine,
  SIMULATION_PHASES,
} from '../src/engine/simulation/simulationEngine.js';
import { MISSION_CAMPAIGNS } from '../src/data/missions.js';

function createTestMission() {
  const campaign = MISSION_CAMPAIGNS[0];

  return {
    ...campaign,
    gameplayDifficulty: 'standard',
    spacecraft: {
      bus: {
        massKg: 120,
        costUSD: 4500000,
      },
      power: {
        generationW: 1100,
        massKg: 45,
        costUSD: 3200000,
        isRTG: false,
      },
      battery: {
        capacityWh: 1500,
        massKg: 32,
        costUSD: 1400000,
      },
      instruments: [
        {
          id: 'inst-optical-hr',
          massKg: 42,
          powerConsumptionW: 95,
          dataRateMbps: 25,
          costUSD: 12000000,
          scienceValue: 40,
        },
      ],
      comms: {
        bandwidthMbps: 45,
        powerConsumptionW: 65,
        massKg: 16,
        costUSD: 2800000,
      },
      adcs: {
        powerConsumptionW: 42,
        massKg: 24,
        costUSD: 4200000,
      },
      computing: {
        powerConsumptionW: 28,
        massKg: 14,
        storageCapacityGB: 128,
        compressionFactor: 0.5,
        costUSD: 5200000,
      },
      thermal: {
        powerConsumptionW: 24,
        massKg: 26,
        costUSD: 1800000,
      },
    },
    launchVehicle: {
      name: 'Falcon 9',
      payloadCapacityKg: 17500,
      launchCostUSD: 67000000,
    },
    orbit: {
      altitudeKm: 705,
      inclinationDeg: 98.2,
    },
    destination: 'earth',
  };
}

function createEngine(seed = 42) {
  return new SimulationEngine(createTestMission(), seed);
}

function forceFirstAnomaly(engine) {
  engine.state.status = SIMULATION_PHASES.PRIMARY_OPS;
  engine.state.missionTimeSeconds = 7200;

  // Force the probability check to pass.
  engine.rng.chance = () => true;

  // Select the first compatible anomaly (ADCS disturbance).
  engine.rng.choice = (items) => items[0];

  engine.checkAnomalies(60);
}

describe('ASTRAJECT Random Anomaly Lifecycle', () => {
  it('triggers an anomaly during primary operations', () => {
    const engine = createEngine();

    forceFirstAnomaly(engine);

    expect(engine.state.activeAnomalies).toHaveLength(1);

    const anomaly = engine.state.activeAnomalies[0];

    expect(anomaly.id).toBe('adcs-pointing-disturbance');
    expect(anomaly.startedAtSeconds).toBe(7200);
    expect(anomaly.expiresAtSeconds).toBe(
      7200 + anomaly.durationSeconds
    );

    expect(engine.state.subsystemHealth.adcs).toBe(98);

    expect(
      engine.state.events.some(
        (event) =>
          event.category === 'ANOMALY' &&
          event.severity === 'WARNING'
      )
    ).toBe(true);
  });

  it('automatically recovers an expired anomaly', () => {
    const engine = createEngine();

    forceFirstAnomaly(engine);

    const anomaly = engine.state.activeAnomalies[0];

    expect(engine.state.subsystemHealth.adcs).toBe(98);

    // Prevent a new anomaly from triggering during recovery.
    engine.state.status = SIMULATION_PHASES.COMPLETED;
    engine.state.missionTimeSeconds = anomaly.expiresAtSeconds;

    engine.checkAnomalies(60);

    expect(engine.state.activeAnomalies).toHaveLength(0);
    expect(engine.state.subsystemHealth.adcs).toBe(100);

    expect(
      engine.state.events.some(
        (event) => event.category === 'ANOMALY RECOVERY'
      )
    ).toBe(true);
  });

  it('restores only the health impact actually applied', () => {
    const engine = createEngine();

    engine.state.status = SIMULATION_PHASES.PRIMARY_OPS;
    engine.state.missionTimeSeconds = 7200;

    // Only one point of health can be lost before reaching the 60 floor.
    engine.state.subsystemHealth.adcs = 61;

    engine.rng.chance = () => true;
    engine.rng.choice = (items) => items[0];

    engine.checkAnomalies(60);

    expect(engine.state.subsystemHealth.adcs).toBe(60);
    expect(engine.state.activeAnomalies[0].appliedHealthImpact).toBe(1);

    const anomaly = engine.state.activeAnomalies[0];

    engine.state.status = SIMULATION_PHASES.FAILED;
    engine.state.missionTimeSeconds = anomaly.expiresAtSeconds;

    engine.checkAnomalies(60);

    expect(engine.state.subsystemHealth.adcs).toBe(61);
    expect(engine.state.activeAnomalies).toHaveLength(0);
  });

  it('does not trigger anomalies outside primary operations', () => {
    const engine = createEngine();

    let chanceCalls = 0;

    engine.rng.chance = () => {
      chanceCalls++;
      return true;
    };

    engine.state.status = SIMULATION_PHASES.LAUNCH;

    engine.checkAnomalies(60);

    expect(chanceCalls).toBe(0);
    expect(engine.state.activeAnomalies).toHaveLength(0);
    expect(engine.state.subsystemHealth.adcs).toBe(100);
  });

  it('does not create duplicate active instances of the same anomaly', () => {
    const engine = createEngine();

    forceFirstAnomaly(engine);

    expect(engine.state.activeAnomalies).toHaveLength(1);

    // A second trigger attempt at the same mission time.
    // The active anomaly ID must be excluded from the candidate list.
    engine.checkAnomalies(60);

    const activeIds = engine.state.activeAnomalies.map(
      (anomaly) => anomaly.id
    );

    expect(new Set(activeIds).size).toBe(activeIds.length);
    expect(activeIds).not.toEqual([]);
  });

  it('reproduces the same anomaly selection for identical seeds', () => {
    const first = createEngine(2026);
    const second = createEngine(2026);

    for (const engine of [first, second]) {
      engine.state.status = SIMULATION_PHASES.PRIMARY_OPS;
      engine.state.missionTimeSeconds = 7200;

      // Consume the normal seeded random stream while guaranteeing
      // that this test exercises the selection path.
      engine.rng.chance = function () {
        return this.next() < 1;
      };

      engine.checkAnomalies(60);
    }

    expect(first.state.activeAnomalies).toHaveLength(1);
    expect(second.state.activeAnomalies).toHaveLength(1);

    expect(first.state.activeAnomalies[0].id).toBe(
      second.state.activeAnomalies[0].id
    );

    expect(first.state.activeAnomalies[0].startedAtSeconds).toBe(
      second.state.activeAnomalies[0].startedAtSeconds
    );

    expect(first.state.activeAnomalies[0].expiresAtSeconds).toBe(
      second.state.activeAnomalies[0].expiresAtSeconds
    );
  });
});