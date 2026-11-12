import { describe, expect, it } from 'vitest';
import {
  calculateOperationalEffects,
  calculateOperationalEffectsForInterval,
} from '../src/engine/simulation/anomalySystem.js';

describe('Time-weighted anomaly operational effects', () => {
  it('returns nominal effects when no anomalies are active', () => {
    expect(
      calculateOperationalEffectsForInterval([], 0, 10)
    ).toEqual({
      powerGenerationMultiplier: 1,
      dataCollectionMultiplier: 1,
      downlinkMultiplier: 1,
      additionalPowerLoadW: 0,
    });
  });

  it('matches normal effects when active for the whole interval', () => {
    const anomaly = {
      startedAtSeconds: 0,
      expiresAtSeconds: 20,
      effects: {
        powerGenerationMultiplier: 0.8,
        dataCollectionMultiplier: 0.75,
        downlinkMultiplier: 0.5,
        additionalPowerLoadW: 20,
      },
    };

    expect(
      calculateOperationalEffectsForInterval([anomaly], 0, 10)
    ).toEqual(calculateOperationalEffects([anomaly]));
  });

  it('weights an anomaly expiring halfway through the interval', () => {
    const anomaly = {
      startedAtSeconds: 0,
      expiresAtSeconds: 5,
      effects: {
        powerGenerationMultiplier: 0.8,
        additionalPowerLoadW: 20,
      },
    };

    const result = calculateOperationalEffectsForInterval(
      [anomaly],
      0,
      10
    );

    expect(result.powerGenerationMultiplier).toBeCloseTo(0.9);
    expect(result.additionalPowerLoadW).toBeCloseTo(10);
  });

  it('combines overlapping anomalies with separate expiry times', () => {
    const first = {
      startedAtSeconds: 0,
      expiresAtSeconds: 5,
      effects: { dataCollectionMultiplier: 0.75 },
    };

    const second = {
      startedAtSeconds: 0,
      expiresAtSeconds: 10,
      effects: { dataCollectionMultiplier: 0.5 },
    };

    const result = calculateOperationalEffectsForInterval(
      [first, second],
      0,
      10
    );

    expect(result.dataCollectionMultiplier).toBeCloseTo(0.4375);
  });

  it('weights an anomaly that starts halfway through the interval', () => {
    const anomaly = {
      startedAtSeconds: 5,
      expiresAtSeconds: 20,
      effects: { dataCollectionMultiplier: 0.5 },
    };

    const result = calculateOperationalEffectsForInterval(
      [anomaly],
      0,
      10
    );

    expect(result.dataCollectionMultiplier).toBeCloseTo(0.75);
  });

  it('returns nominal effects for invalid intervals', () => {
    const expected = {
      powerGenerationMultiplier: 1,
      dataCollectionMultiplier: 1,
      downlinkMultiplier: 1,
      additionalPowerLoadW: 0,
    };

    expect(
      calculateOperationalEffectsForInterval([], 0, 0)
    ).toEqual(expected);

    expect(
      calculateOperationalEffectsForInterval([], Number.NaN, 10)
    ).toEqual(expected);
  });
});