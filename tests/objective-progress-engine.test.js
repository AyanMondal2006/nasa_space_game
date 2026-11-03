
import { describe, expect, it } from 'vitest';

import { SimulationEngine, SIMULATION_PHASES } from '../src/engine/simulation/simulationEngine.js';

function createEngine(objectives, validationMetrics = null, options = {}) {
  const mission = {
    destination: 'earth',
    durationDays: 10,
    budgetLimitUSD: options.budgetLimitUSD ?? 100_000_000,
    objectives,
    spacecraft: {
      battery: {
        capacityWh: options.batteryCapacityWh ?? 1000,
      },
      power: {
        generationW: 200,
      },
      instruments: [],
    },
  };

  return new SimulationEngine(mission, 42, validationMetrics);
}

describe('Mission objective progress engine', () => {
  it('measures data_volume from collected data by default', () => {
    const engine = createEngine([
      { id: 'data', type: 'data_volume', targetValueGB: 10 },
    ]);

    engine.state.totalDataCollectedMB = 5 * 1024;
    engine.state.totalDataDownlinkedMB = 1 * 1024;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.data).toBe(50);
  });

  it('generates non-zero science data using the configured duty cycle', () => {
    const engine = createEngine([]);
    engine.mission.spacecraft.instruments = [
      { id: 'test-instrument', dataRateMbps: 1, powerConsumptionW: 1 },
    ];
    engine.mission.spacecraft.computing = {
      compressionFactor: 0.6,
      storageCapacityGB: 64,
    };
    engine.state.status = SIMULATION_PHASES.PRIMARY_OPS;
    engine.state.isPaused = false;

    engine.step(60);

    expect(engine.state.totalDataCollectedMB).toBeGreaterThan(0);
  });

  it('supports explicitly measuring a returned-data objective from downlinked data', () => {
    const engine = createEngine([
      { id: 'return', type: 'data_volume', dataSource: 'downlinked', targetValueGB: 10 },
    ]);

    engine.state.totalDataCollectedMB = 5 * 1024;
    engine.state.totalDataDownlinkedMB = 1 * 1024;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.return).toBe(10);
  });

  it('calculates downlink efficiency from the actual collected and downlinked totals', () => {
    const engine = createEngine([
      { id: 'downlink', type: 'downlink_efficiency', targetValuePercent: 80 },
    ]);

    engine.state.totalDataCollectedMB = 1000;
    engine.state.totalDataDownlinkedMB = 500;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.downlink).toBe(63);
  });

  it('uses depth-of-discharge evidence rather than battery state-of-charge', () => {
    const engine = createEngine(
      [{ id: 'battery', type: 'battery_health', targetValueMaxDoD: 0.6 }],
      { power: { dodReached: 0.75 } },
    );

    engine.state.batteryPercent = 95;
    engine.state.maxObservedBatteryDoDPercent = 5;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.battery).toBe(80);
  });

  it('uses the maximum observed battery discharge during simulation', () => {
    const engine = createEngine([
      { id: 'battery', type: 'battery_health', targetValueMaxDoD: 0.6 },
    ]);

    engine.state.maxObservedBatteryDoDPercent = 80;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.battery).toBe(75);
  });

  it('calculates budget progress from the required contingency reserve', () => {
    const engine = createEngine(
      [{ id: 'budget', type: 'budget_performance', targetReservePercent: 10 }],
      { budget: { totalCost: 95_000_000 } },
    );

    engine.updateObjectivesProgress();
    expect(engine.state.objectivesProgress.budget).toBe(50);
  });

  it('awards zero budget progress when the mission exceeds its budget', () => {
    const engine = createEngine(
      [{ id: 'budget', type: 'budget_performance', targetReservePercent: 10 }],
      { budget: { totalCost: 110_000_000 } },
    );

    engine.updateObjectivesProgress();
    expect(engine.state.objectivesProgress.budget).toBe(0);
  });

  it('awards full budget progress when the required contingency reserve is preserved', () => {
    const engine = createEngine(
      [{ id: 'budget', type: 'budget_performance', targetReservePercent: 10 }],
      { budget: { totalCost: 90_000_000 } },
    );

    engine.updateObjectivesProgress();
    expect(engine.state.objectivesProgress.budget).toBe(100);
  });

  it('calculates power-margin progress from the validated daylight margin', () => {
    const engine = createEngine(
      [{ id: 'power', type: 'power_margin', targetValuePercent: 25 }],
      { power: { daylightPowerMarginPercent: 20 } },
    );

    engine.updateObjectivesProgress();
    expect(engine.state.objectivesProgress.power).toBe(80);
  });

  it('uses a thermal margin metric when supplied by a thermal validator', () => {
    const engine = createEngine(
      [{ id: 'thermal', type: 'thermal_margin', targetValueMinWatts: 50 }],
      { thermal: { thermalMarginW: 25 } },
    );

    engine.updateObjectivesProgress();
    expect(engine.state.objectivesProgress.thermal).toBe(50);
  });

  it('does not infer successful orbital insertion from the scripted mission phase', () => {
    const engine = createEngine([
      { id: 'insertion', type: 'orbital_insertion', targetValueDeltaVMs: 1100 },
    ]);

    engine.state.status = SIMULATION_PHASES.PRIMARY_OPS;
    engine.state.achievedDeltaVMs = 0;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.insertion).toBe(0);
  });

  it('calculates orbital insertion progress from explicitly achieved delta-V', () => {
    const engine = createEngine([
      { id: 'insertion', type: 'orbital_insertion', targetValueDeltaVMs: 1100 },
    ]);

    engine.state.achievedDeltaVMs = 550;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.insertion).toBe(50);
  });

  it('uses an explicit operational-readiness metric and does not substitute elapsed time', () => {
    const engine = createEngine(
      [{ id: 'readiness', type: 'operational_readiness', targetValuePercent: 100 }],
      { operationalReadinessPercent: 80 },
    );

    engine.state.missionTimeSeconds = engine.state.targetDurationSeconds;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.readiness).toBe(80);
  });

  it('leaves readiness, thermal, and unknown objectives uncredited when evidence is missing', () => {
    const engine = createEngine([
      { id: 'readiness', type: 'operational_readiness', targetValuePercent: 100 },
      { id: 'thermal', type: 'thermal_margin', targetValueMinWatts: 50 },
      { id: 'unknown', type: 'unimplemented_objective' },
    ]);

    engine.state.missionTimeSeconds = engine.state.targetDurationSeconds;
    engine.updateObjectivesProgress();

    expect(engine.state.objectivesProgress.readiness).toBe(0);
    expect(engine.state.objectivesProgress.thermal).toBe(0);
    expect(engine.state.objectivesProgress.unknown).toBe(0);
  });

  it('keeps progress finite and bounded when validation data is invalid', () => {
    const engine = createEngine(
      [
        { id: 'budget', type: 'budget_performance', targetValuePercent: 100 },
        { id: 'power', type: 'power_margin', targetValuePercent: 25 },
        { id: 'downlink', type: 'downlink_efficiency', targetValuePercent: 80 },
      ],
      {
        budget: { totalCost: Number.NaN },
        power: { daylightPowerMarginPercent: Number.POSITIVE_INFINITY },
      },
    );

    engine.state.totalDataCollectedMB = 100;
    engine.state.totalDataDownlinkedMB = 1000;
    engine.updateObjectivesProgress();

    for (const value of Object.values(engine.state.objectivesProgress)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(engine.state.objectivesProgress.budget).toBe(0);
    expect(engine.state.objectivesProgress.power).toBe(0);
    expect(engine.state.objectivesProgress.downlink).toBe(100);
  });
});
