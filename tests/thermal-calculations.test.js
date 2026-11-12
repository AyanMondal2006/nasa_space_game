
import { describe, expect, it } from 'vitest';

import {
  calculateThermalBudget,
  calculateColdCaseThermalBudget,
  STEFAN_BOLTZMANN_CONSTANT,
} from '../src/engine/calculations/thermal.js';

function createThermalSystem(overrides = {}) {
  return {
    id: 'test-active-louvers',
    name: 'Test Active Thermal System',
    thermalScreeningModel: {
      radiatorAreaM2: 1.75,
      radiatorEmissivity: 0.85,
      radiatorOperatingTemperatureK: 300,
      viewFactorToColdSink: 0.85,
      assumptionStatus: 'GAME_DESIGN_ASSUMPTION',
      ...overrides,
    },
  };
}

function createColdCaseThermalSystem(overrides = {}) {
  return {
    id: 'test-cold-case-thermal',
    coldCaseScreeningModel: {
      effectiveInsulatedAreaM2: 1.6,
      effectiveInsulationEmissivity: 0.03,
      viewFactorToColdSink: 0.85,
      conductiveHeatLeakW: 18,
      heaterPowerAvailableW: 24,
      assumptionStatus: 'GAME_DESIGN_ASSUMPTION',
      ...overrides,
    },
  };
}

describe('Spacecraft Thermal Calculation Engine', () => {

  it('calculates radiator heat rejection using the Stefan-Boltzmann equation', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem(),
      internalHeatLoadW: 419,
      externalHeatLoadW: 0,
      sinkTemperatureK: 40,
    });

    const expectedHeatRejection =
      0.85 *
      STEFAN_BOLTZMANN_CONSTANT *
      1.75 *
      0.85 *
      (Math.pow(300, 4) - Math.pow(40, 4));

    expect(result.isEvaluable).toBe(true);

    expect(result.radiatorHeatRejectionW).toBeCloseTo(
      expectedHeatRejection,
      6
    );

    expect(result.internalHeatLoadW).toBe(419);
    expect(result.externalHeatLoadW).toBe(0);
  });

  it('reports positive radiator thermal margin', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem(),
      internalHeatLoadW: 419,
      externalHeatLoadW: 0,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(true);
    expect(result.thermalMarginW).toBeGreaterThan(0);
    expect(result.isThermallyFeasible).toBe(true);
    expect(result.isEngineeringCertified).toBe(false);
  });

  it('reports negative radiator thermal margin when heat load exceeds capacity', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem(),
      internalHeatLoadW: 700,
      externalHeatLoadW: 100,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(true);
    expect(result.totalHeatLoadW).toBe(800);
    expect(result.thermalMarginW).toBeLessThan(0);
    expect(result.isThermallyFeasible).toBe(false);
  });

  it('does not evaluate a thermal system without radiator parameters', () => {
    const result = calculateThermalBudget({
      thermalSystem: { id: 'incomplete-thermal-system' },
      internalHeatLoadW: 100,
      externalHeatLoadW: 20,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.thermalMarginW).toBeNull();
    expect(result.missingInputs.length).toBeGreaterThan(0);
  });

  it('rejects emissivity greater than one', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem({
        radiatorEmissivity: 1.5,
      }),
      internalHeatLoadW: 100,
      externalHeatLoadW: 20,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.missingInputs).toContain(
      'Radiator emissivity between 0 and 1'
    );
  });

  it('rejects a zero-area radiator', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem({
        radiatorAreaM2: 0,
      }),
      internalHeatLoadW: 100,
      externalHeatLoadW: 20,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.thermalMarginW).toBeNull();
  });

  it('does not evaluate when external radiator heat load is missing', () => {
    const result = calculateThermalBudget({
      thermalSystem: createThermalSystem(),
      internalHeatLoadW: 100,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.thermalMarginW).toBeNull();
    expect(result.missingInputs).toContain(
      'Quantified external heat load in watts'
    );
  });

  it('does not evaluate cryocooler hardware without a separate cooling model', () => {
    const result = calculateThermalBudget({
      thermalSystem: {
        id: 'thm-cryocooler',
        thermalScreeningModel: null,
      },
      internalHeatLoadW: 100,
      externalHeatLoadW: 20,
      sinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.thermalMarginW).toBeNull();
  });
});

describe('Cold-Case Thermal Survival Engine', () => {

  it('calculates radiative and conductive heat losses', () => {
    const result = calculateColdCaseThermalBudget({
      thermalSystem: createColdCaseThermalSystem(),
      internalWasteHeatW: 10,
      externalHeatGainW: 0,
      equipmentTemperatureK: 273,
      coldSinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(true);
    expect(result.radiativeHeatLossW).toBeGreaterThan(0);
    expect(result.conductiveHeatLeakW).toBe(18);

    expect(result.totalHeatLossW).toBeCloseTo(
      result.radiativeHeatLossW + 18,
      8
    );
  });

  it('reports positive cold-case margin when available heat exceeds losses', () => {
    const result = calculateColdCaseThermalBudget({
      thermalSystem: createColdCaseThermalSystem(),
      internalWasteHeatW: 20,
      externalHeatGainW: 0,
      equipmentTemperatureK: 273,
      coldSinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(true);
    expect(result.coldCaseThermalMarginW).toBeGreaterThan(0);
    expect(result.thermalMarginW).toBe(
      result.coldCaseThermalMarginW
    );
    expect(result.isThermallyFeasible).toBe(true);
  });

  it('reports negative cold-case margin when available heat is insufficient', () => {
    const result = calculateColdCaseThermalBudget({
      thermalSystem: createColdCaseThermalSystem({
        heaterPowerAvailableW: 0,
      }),
      internalWasteHeatW: 0,
      externalHeatGainW: 0,
      equipmentTemperatureK: 273,
      coldSinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(true);
    expect(result.coldCaseThermalMarginW).toBeLessThan(0);
    expect(result.isThermallyFeasible).toBe(false);
  });

  it('does not evaluate when cold-case thermal parameters are missing', () => {
    const result = calculateColdCaseThermalBudget({
      thermalSystem: {
        id: 'incomplete-cold-case-system',
      },
      internalWasteHeatW: 20,
      externalHeatGainW: 0,
      equipmentTemperatureK: 273,
      coldSinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.thermalMarginW).toBeNull();
  });

  it('rejects invalid cold-case emissivity', () => {
    const result = calculateColdCaseThermalBudget({
      thermalSystem: createColdCaseThermalSystem({
        effectiveInsulationEmissivity: 1.5,
      }),
      internalWasteHeatW: 20,
      externalHeatGainW: 0,
      equipmentTemperatureK: 273,
      coldSinkTemperatureK: 40,
    });

    expect(result.isEvaluable).toBe(false);
    expect(result.missingInputs).toContain(
      'Effective insulation emissivity between 0 and 1'
    );
  });
});
