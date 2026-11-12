import { describe, expect, it } from 'vitest';

import {
  applyDifficultyToObjectives,
  GAMEPLAY_DIFFICULTY,
} from '../src/data/difficultyProfiles.js';

const TEST_OBJECTIVES = [
  {
    id: 'data',
    title: 'Collect 250 GB of Science Data',
    type: 'data_volume',
    targetValueGB: 250,
  },
  {
    id: 'downlink',
    title: 'Downlink Science Return > 90%',
    type: 'downlink_efficiency',
    targetValuePercent: 90,
  },
  {
    id: 'battery',
    title: 'Maintain Battery Depth-of-Discharge < 60%',
    type: 'battery_health',
    targetValueMaxDoD: 0.6,
  },
  {
    id: 'budget',
    title: 'Preserve Budget Contingency',
    type: 'budget_performance',
    targetReservePercent: 10,
    description: 'Preserve at least 10% budget reserve.',
  },
  {
    id: 'power',
    title: 'Maintain Positive Power Margin',
    type: 'power_margin',
    targetValuePercent: 25,
  },
  {
    id: 'thermal',
    title: 'Maintain Thermal Margin',
    type: 'thermal_margin',
    targetValueMinWatts: 50,
  },
  {
    id: 'readiness',
    title: 'Achieve 100% Operational Readiness',
    type: 'operational_readiness',
    targetValuePercent: 100,
  },
  {
    id: 'insertion',
    title: 'Execute Lunar Orbit Insertion',
    type: 'orbital_insertion',
    targetValueDeltaVMs: 1100,
  },
];

describe('Gameplay difficulty profiles', () => {
  it('keeps all original objective targets in Standard mode', () => {
    const result = applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      GAMEPLAY_DIFFICULTY.STANDARD
    );

    expect(result.map((item) => ({
      id: item.id,
      targetValueGB: item.targetValueGB,
      targetValuePercent: item.targetValuePercent,
      targetValueMaxDoD: item.targetValueMaxDoD,
      targetReservePercent: item.targetReservePercent,
      targetValueMinWatts: item.targetValueMinWatts,
      targetValueDeltaVMs: item.targetValueDeltaVMs,
    }))).toEqual([
      {
        id: 'data',
        targetValueGB: 250,
      },
      {
        id: 'downlink',
        targetValuePercent: 90,
      },
      {
        id: 'battery',
        targetValueMaxDoD: 0.6,
      },
      {
        id: 'budget',
        targetReservePercent: 10,
      },
      {
        id: 'power',
        targetValuePercent: 25,
      },
      {
        id: 'thermal',
        targetValueMinWatts: 50,
      },
      {
        id: 'readiness',
        targetValuePercent: 100,
      },
      {
        id: 'insertion',
        targetValueDeltaVMs: 1100,
      },
    ]);
  });

  it('makes supported objectives more forgiving in Beginner mode', () => {
    const result = applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      GAMEPLAY_DIFFICULTY.BEGINNER
    );

    expect(result[0].targetValueGB).toBe(200);
    expect(result[1].targetValuePercent).toBe(80);
    expect(result[2].targetValueMaxDoD).toBe(0.7);
    expect(result[3].targetReservePercent).toBe(5);
    expect(result[4].targetValuePercent).toBe(20);
    expect(result[5].targetValueMinWatts).toBe(40);
    expect(result[6].targetValuePercent).toBe(90);

    expect(result[0].title).toContain('200 GB');
    expect(result[1].title).toContain('80%');
    expect(result[2].title).toContain('70%');
    expect(result[3].description).toContain('5%');
  });

  it('makes supported objectives more demanding in Advanced mode', () => {
    const result = applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    expect(result[0].targetValueGB).toBe(300);
    expect(result[1].targetValuePercent).toBe(95);
    expect(result[2].targetValueMaxDoD).toBe(0.5);
    expect(result[3].targetReservePercent).toBe(15);
    expect(result[4].targetValuePercent).toBe(35);
    expect(result[5].targetValueMinWatts).toBe(60);

    // Readiness is already at its 100% upper limit.
    expect(result[6].targetValuePercent).toBe(100);
  });

  it('does not modify orbital insertion delta-V at any difficulty', () => {
    for (const difficulty of Object.values(GAMEPLAY_DIFFICULTY)) {
      const result = applyDifficultyToObjectives(
        TEST_OBJECTIVES,
        difficulty
      );

      const insertionObjective = result.find(
        (item) => item.id === 'insertion'
      );

      expect(insertionObjective.targetValueDeltaVMs).toBe(1100);
    }
  });

  it('does not mutate the original campaign objective definitions', () => {
    const originalSnapshot = JSON.parse(
      JSON.stringify(TEST_OBJECTIVES)
    );

    applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    expect(TEST_OBJECTIVES).toEqual(originalSnapshot);
  });

  it('falls back to Standard for an unknown difficulty value', () => {
    const result = applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      'unsupported-mode'
    );

    expect(result[0].targetValueGB).toBe(250);
    expect(result[1].targetValuePercent).toBe(90);
  });

  it('returns an empty array when objectives are missing', () => {
    expect(applyDifficultyToObjectives(null)).toEqual([]);
    expect(applyDifficultyToObjectives(undefined)).toEqual([]);
  });

  it('adds readable target labels to adjusted objectives', () => {
    const result = applyDifficultyToObjectives(
      TEST_OBJECTIVES,
      GAMEPLAY_DIFFICULTY.BEGINNER
    );

    expect(result[0].difficultyTargetLabel).toBe('Target: 200 GB');
    expect(result[1].difficultyTargetLabel).toBe('Target: 80%');
    expect(result[2].difficultyTargetLabel).toBe('Maximum DoD: 70%');
    expect(result[3].difficultyTargetLabel).toBe('Budget reserve: 5%');
    expect(result[4].difficultyTargetLabel).toBe('Power margin: 20%');
    expect(result[5].difficultyTargetLabel).toBe('Thermal margin: 40 W');
    expect(result[6].difficultyTargetLabel).toBe('Readiness: 90%');
    expect(result[7].difficultyTargetLabel).toBe(
      'Required delta-V: 1100 m/s'
    );
  });

  it('clamps percentage and battery targets to valid ranges', () => {
    const edgeObjectives = [
      {
        id: 'downlink',
        type: 'downlink_efficiency',
        targetValuePercent: 5,
      },
      {
        id: 'battery',
        type: 'battery_health',
        targetValueMaxDoD: 0.95,
      },
      {
        id: 'reserve',
        type: 'budget_performance',
        targetReservePercent: 98,
      },
    ];

    const beginner = applyDifficultyToObjectives(
      edgeObjectives,
      GAMEPLAY_DIFFICULTY.BEGINNER
    );

    const advanced = applyDifficultyToObjectives(
      edgeObjectives,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    expect(beginner[0].targetValuePercent).toBe(0);
    expect(beginner[1].targetValueMaxDoD).toBe(1);
    expect(advanced[2].targetReservePercent).toBe(100);
  });
});