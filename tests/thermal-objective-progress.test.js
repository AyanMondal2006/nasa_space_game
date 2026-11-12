
import { describe, expect, it } from 'vitest';

import {
  SimulationEngine,
} from '../src/engine/simulation/simulationEngine.js';

function createSimulation(thermalMetrics) {
  const mission = {
    destination: 'earth',
    durationDays: 120,

    orbit: {
      altitudeKm: 705,
      inclinationDeg: 98.2,
    },

    objectives: [
      {
        id: 'obj-lunar-thermal',
        type: 'thermal_margin',
        targetValueMinWatts: 50,
      },
    ],
  };

  return new SimulationEngine(
    mission,
    42,
    thermalMetrics === undefined
      ? null
      : { thermal: thermalMetrics }
  );
}

describe('Thermal Mission Objective Progress', () => {

  it('awards 100% when validated thermal margin exceeds the target', () => {
    const simulation = createSimulation({
      isEvaluable: true,
      thermalMarginW: 145.127,
    });

    simulation.updateObjectivesProgress();

    expect(
      simulation.state.objectivesProgress['obj-lunar-thermal']
    ).toBe(100);
  });

  it('calculates partial progress when thermal margin is below target', () => {
    const simulation = createSimulation({
      isEvaluable: true,
      thermalMarginW: 25,
    });

    simulation.updateObjectivesProgress();

    expect(
      simulation.state.objectivesProgress['obj-lunar-thermal']
    ).toBe(50);
  });

  it('does not award progress when thermal evidence is unevaluable', () => {
    const simulation = createSimulation({
      isEvaluable: false,
      thermalMarginW: null,
    });

    simulation.updateObjectivesProgress();

    expect(
      simulation.state.objectivesProgress['obj-lunar-thermal']
    ).toBe(0);
  });

  it('does not award progress when validation metrics are missing', () => {
    const simulation = createSimulation(undefined);

    simulation.updateObjectivesProgress();

    expect(
      simulation.state.objectivesProgress['obj-lunar-thermal']
    ).toBe(0);
  });
});
