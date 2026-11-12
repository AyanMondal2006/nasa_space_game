import { describe, expect, it } from 'vitest';

import {
  BASE_ANOMALY_RATE_PER_HOUR,
  RANDOM_ANOMALY_CATALOG,
  ANOMALY_DIFFICULTY_MULTIPLIERS,
  getAnomalyProbability,
  getAvailableRandomAnomalies,
  calculateOperationalEffects,
} from '../src/engine/simulation/anomalySystem.js';

describe('ASTRAJECT Random Anomaly System', () => {
  it('uses the configured Standard anomaly rate per simulated hour', () => {
    expect(
      getAnomalyProbability(3600, 'standard')
    ).toBeCloseTo(BASE_ANOMALY_RATE_PER_HOUR, 10);
  });

  it('scales anomaly probability with gameplay difficulty', () => {
    const beginner = getAnomalyProbability(3600, 'beginner');
    const standard = getAnomalyProbability(3600, 'standard');
    const advanced = getAnomalyProbability(3600, 'advanced');

    expect(beginner).toBeCloseTo(0.00025, 10);
    expect(standard).toBeCloseTo(0.0005, 10);
    expect(advanced).toBeCloseTo(0.00075, 10);

    expect(beginner).toBeLessThan(standard);
    expect(standard).toBeLessThan(advanced);

    expect(ANOMALY_DIFFICULTY_MULTIPLIERS).toEqual({
      beginner: 0.5,
      standard: 1,
      advanced: 1.5,
    });
  });

  it('scales probability correctly with simulation delta time', () => {
    const oneHour = getAnomalyProbability(3600, 'standard');
    const twoHours = getAnomalyProbability(7200, 'standard');

    expect(twoHours).toBeCloseTo(
      1 - Math.pow(1 - oneHour, 2),
      10
    );
  });

  it('returns zero probability for invalid or non-positive time', () => {
    expect(getAnomalyProbability(0)).toBe(0);
    expect(getAnomalyProbability(-60)).toBe(0);
    expect(getAnomalyProbability(Number.NaN)).toBe(0);
    expect(
      getAnomalyProbability(Number.POSITIVE_INFINITY)
    ).toBe(0);
  });

  it('uses Standard probability for an unknown difficulty', () => {
    expect(
      getAnomalyProbability(3600, 'unknown')
    ).toBeCloseTo(0.0005, 10);
  });

  it('defines five anomalies with valid durations and impacts', () => {
    expect(RANDOM_ANOMALY_CATALOG).toHaveLength(5);

    RANDOM_ANOMALY_CATALOG.forEach((anomaly) => {
      expect(anomaly.id).toBeTruthy();
      expect(anomaly.subsystem).toBeTruthy();
      expect(anomaly.durationSeconds).toBeGreaterThan(0);
      expect(anomaly.healthImpact).toBeGreaterThanOrEqual(0);
      expect(anomaly.effects).toBeTruthy();
      expect(anomaly.message).toBeTruthy();
      expect(anomaly.recoveryMessage).toBeTruthy();
    });
  });

  it('excludes solar-array faults for RTG-powered missions', () => {
    const mission = {
      spacecraft: {
        power: { isRTG: true },
        battery: { capacityWh: 1000 },
        adcs: {},
        comms: {},
        thermal: {},
      },
    };

    const available = getAvailableRandomAnomalies(mission);

    expect(
      available.some(
        (event) => event.id === 'solar-array-string-fault'
      )
    ).toBe(false);

    expect(available).toHaveLength(4);
  });

  it('includes solar-array faults for solar-powered missions', () => {
    const mission = {
      spacecraft: {
        power: { isRTG: false },
        battery: { capacityWh: 1000 },
        adcs: {},
        comms: {},
        thermal: {},
      },
    };

    const available = getAvailableRandomAnomalies(mission);

    expect(
      available.some(
        (event) => event.id === 'solar-array-string-fault'
      )
    ).toBe(true);
  });

  it('excludes battery faults when battery capacity is zero', () => {
    const mission = {
      spacecraft: {
        power: { isRTG: false },
        battery: { capacityWh: 0 },
        adcs: {},
        comms: {},
        thermal: {},
      },
    };

    const available = getAvailableRandomAnomalies(mission);

    expect(
      available.some(
        (event) => event.id === 'battery-controller-fault'
      )
    ).toBe(false);
  });

  it('returns nominal effects when no anomaly is active', () => {
    expect(calculateOperationalEffects([])).toEqual({
      powerGenerationMultiplier: 1,
      dataCollectionMultiplier: 1,
      downlinkMultiplier: 1,
      additionalPowerLoadW: 0,
    });
  });

  it('combines operational effects from multiple anomalies', () => {
    const effects = calculateOperationalEffects([
      {
        effects: {
          dataCollectionMultiplier: 0.75,
          downlinkMultiplier: 0.5,
          additionalPowerLoadW: 20,
        },
      },
      {
        effects: {
          dataCollectionMultiplier: 0.9,
          powerGenerationMultiplier: 0.8,
          additionalPowerLoadW: 15,
        },
      },
    ]);

    expect(effects).toEqual({
      powerGenerationMultiplier: 0.8,
      dataCollectionMultiplier: 0.675,
      downlinkMultiplier: 0.5,
      additionalPowerLoadW: 35,
    });
  });

  it('bounds overlapping operational effects', () => {
    const effects = calculateOperationalEffects([
      {
        effects: {
          powerGenerationMultiplier: 0.1,
          dataCollectionMultiplier: 0.1,
          downlinkMultiplier: 0.1,
          additionalPowerLoadW: 80,
        },
      },
      {
        effects: {
          additionalPowerLoadW: 80,
        },
      },
    ]);

    expect(effects.powerGenerationMultiplier).toBe(0.4);
    expect(effects.dataCollectionMultiplier).toBe(0.3);
    expect(effects.downlinkMultiplier).toBe(0.3);
    expect(effects.additionalPowerLoadW).toBe(100);
  });

  it('returns nominal effects for invalid active anomaly input', () => {
    expect(calculateOperationalEffects(null)).toEqual({
      powerGenerationMultiplier: 1,
      dataCollectionMultiplier: 1,
      downlinkMultiplier: 1,
      additionalPowerLoadW: 0,
    });
  });
});