
/**
 * Spacecraft Thermal Engineering Screening Engine
 *
 * Provides two independent first-order thermal calculations:
 *
 * 1. Hot-case radiator heat rejection.
 * 2. Cold-case thermal survival.
 *
 * IMPORTANT:
 * These are educational screening models, not spacecraft
 * thermal qualification or certification tools.
 */

export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8;

function readNonNegativeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function createUnevaluableResult(missingInputs, reason) {
  return {
    isEvaluable: false,
    isEngineeringCertified: false,
    thermalMarginW: null,
    reason,
    missingInputs,
  };
}

function validateRadiativeProperties({
  areaM2,
  emissivity,
  viewFactor,
  temperatureK,
  sinkTemperatureK,
  areaLabel,
  emissivityLabel,
  viewFactorLabel,
  temperatureLabel,
  sinkTemperatureLabel,
}) {
  const missingInputs = [];

  if (areaM2 === null || areaM2 <= 0) {
    missingInputs.push(areaLabel);
  }

  if (
    emissivity === null ||
    emissivity <= 0 ||
    emissivity > 1
  ) {
    missingInputs.push(emissivityLabel);
  }

  if (
    viewFactor === null ||
    viewFactor <= 0 ||
    viewFactor > 1
  ) {
    missingInputs.push(viewFactorLabel);
  }

  if (temperatureK === null || temperatureK <= 0) {
    missingInputs.push(temperatureLabel);
  }

  if (sinkTemperatureK === null || sinkTemperatureK <= 0) {
    missingInputs.push(sinkTemperatureLabel);
  }

  return missingInputs;
}

/**
 * HOT-CASE RADIATOR HEAT-REJECTION MODEL
 *
 * Q = emissivity * sigma * area * viewFactor
 *     * (radiatorTemperature^4 - sinkTemperature^4)
 */
export function calculateThermalBudget({
  thermalSystem,
  internalHeatLoadW,
  externalHeatLoadW,
  sinkTemperatureK,
} = {}) {
  const model = thermalSystem?.thermalScreeningModel;

  if (!model || typeof model !== 'object') {
    return createUnevaluableResult(
      ['Thermal component with a valid thermalScreeningModel'],
      'Thermal radiator screening parameters are unavailable.'
    );
  }

  const radiatorAreaM2 = readNonNegativeNumber(
    model.radiatorAreaM2
  );

  const emissivity = readNonNegativeNumber(
    model.radiatorEmissivity
  );

  const radiatorTemperatureK = readNonNegativeNumber(
    model.radiatorOperatingTemperatureK
  );

  const viewFactor = readNonNegativeNumber(
    model.viewFactorToColdSink
  );

  const internalLoadW = readNonNegativeNumber(
    internalHeatLoadW
  );

  const externalLoadW = readNonNegativeNumber(
    externalHeatLoadW
  );

  const sinkTemperature = readNonNegativeNumber(
    sinkTemperatureK
  );

  const missingInputs = validateRadiativeProperties({
    areaM2: radiatorAreaM2,
    emissivity,
    viewFactor,
    temperatureK: radiatorTemperatureK,
    sinkTemperatureK: sinkTemperature,
    areaLabel: 'Positive radiator area in square metres',
    emissivityLabel: 'Radiator emissivity between 0 and 1',
    viewFactorLabel: 'Radiator view factor greater than 0 and at most 1',
    temperatureLabel: 'Positive radiator operating temperature in Kelvin',
    sinkTemperatureLabel: 'Positive radiative sink temperature in Kelvin',
  });

  if (internalLoadW === null) {
    missingInputs.push('Quantified internal heat load in watts');
  }

  if (externalLoadW === null) {
    missingInputs.push('Quantified external heat load in watts');
  }

  if (missingInputs.length > 0) {
    return createUnevaluableResult(
      missingInputs,
      'Radiator heat rejection cannot be calculated because required inputs are missing or invalid.'
    );
  }

  const radiatorHeatRejectionW =
    emissivity *
    STEFAN_BOLTZMANN_CONSTANT *
    radiatorAreaM2 *
    viewFactor *
    (
      Math.pow(radiatorTemperatureK, 4) -
      Math.pow(sinkTemperature, 4)
    );

  const totalHeatLoadW =
    internalLoadW + externalLoadW;

  const radiatorThermalMarginW =
    radiatorHeatRejectionW - totalHeatLoadW;

  const isRadiatorThermallyFeasible =
    radiatorThermalMarginW >= 0;

  return {
    isEvaluable: true,
    isEngineeringCertified: false,
    modelFidelity: 'first_order_radiative_screening',

    assumptionStatus:
      model.assumptionStatus || 'UNSPECIFIED',

    radiatorAreaM2,
    radiatorEmissivity: emissivity,
    radiatorOperatingTemperatureK: radiatorTemperatureK,
    viewFactorToColdSink: viewFactor,
    sinkTemperatureK: sinkTemperature,

    radiatorHeatRejectionW,

    internalHeatLoadW: internalLoadW,
    externalHeatLoadW: externalLoadW,
    totalHeatLoadW,

    // Original public API fields retained for backward compatibility.
    thermalMarginW: radiatorThermalMarginW,
    isThermallyFeasible: isRadiatorThermallyFeasible,

    // Explicitly named radiator-specific fields.
    radiatorThermalMarginW,
    isRadiatorThermallyFeasible,

    reason: null,
    missingInputs: [],

    limitations: [
      'First-order steady-state radiation model.',
      'Detailed conduction and transient thermal behaviour are not modelled.',
      'Environmental radiation must be represented by the supplied external load and sink temperature.',
      'Positive radiator margin does not prove cold-case instrument survival.',
      'Cryocooler performance requires a separate cooling model.',
    ],
  };
}

/**
 * COLD-CASE THERMAL SURVIVAL MODEL
 *
 * Evaluates whether available heat can offset estimated:
 * - Radiative heat loss.
 * - Conductive heat leakage.
 *
 * Cold-case margin =
 *   Internal waste heat
 *   + heater power
 *   + external heat gain
 *   - radiative heat loss
 *   - conductive heat loss
 */
export function calculateColdCaseThermalBudget({
  thermalSystem,
  internalWasteHeatW,
  externalHeatGainW,
  equipmentTemperatureK,
  coldSinkTemperatureK,
} = {}) {
  const model = thermalSystem?.coldCaseScreeningModel;

  if (!model || typeof model !== 'object') {
    return createUnevaluableResult(
      ['Thermal component with a valid coldCaseScreeningModel'],
      'Cold-case insulation and heater parameters are unavailable.'
    );
  }

  const effectiveAreaM2 = readNonNegativeNumber(
    model.effectiveInsulatedAreaM2
  );

  const effectiveEmissivity = readNonNegativeNumber(
    model.effectiveInsulationEmissivity
  );

  const viewFactor = readNonNegativeNumber(
    model.viewFactorToColdSink
  );

  const conductiveHeatLeakW = readNonNegativeNumber(
    model.conductiveHeatLeakW
  );

  const heaterPowerAvailableW = readNonNegativeNumber(
    model.heaterPowerAvailableW
  );

  const internalHeatW = readNonNegativeNumber(
    internalWasteHeatW
  );

  const externalHeatW = readNonNegativeNumber(
    externalHeatGainW
  );

  const equipmentTemperature = readNonNegativeNumber(
    equipmentTemperatureK
  );

  const sinkTemperature = readNonNegativeNumber(
    coldSinkTemperatureK
  );

  const missingInputs = validateRadiativeProperties({
    areaM2: effectiveAreaM2,
    emissivity: effectiveEmissivity,
    viewFactor,
    temperatureK: equipmentTemperature,
    sinkTemperatureK: sinkTemperature,
    areaLabel: 'Positive effective insulated area in square metres',
    emissivityLabel: 'Effective insulation emissivity between 0 and 1',
    viewFactorLabel: 'Cold-case view factor greater than 0 and at most 1',
    temperatureLabel: 'Positive equipment operating temperature in Kelvin',
    sinkTemperatureLabel: 'Positive cold-sink temperature in Kelvin',
  });

  if (conductiveHeatLeakW === null) {
    missingInputs.push('Conductive heat leakage in watts');
  }

  if (heaterPowerAvailableW === null) {
    missingInputs.push('Available cold-case heater power in watts');
  }

  if (internalHeatW === null) {
    missingInputs.push('Available internal waste heat in watts');
  }

  if (externalHeatW === null) {
    missingInputs.push('Absorbed external heat gain in watts');
  }

  if (missingInputs.length > 0) {
    return createUnevaluableResult(
      missingInputs,
      'Cold-case thermal survival cannot be evaluated because required inputs are missing or invalid.'
    );
  }

  const radiativeHeatLossW =
    effectiveEmissivity *
    STEFAN_BOLTZMANN_CONSTANT *
    effectiveAreaM2 *
    viewFactor *
    (
      Math.pow(equipmentTemperature, 4) -
      Math.pow(sinkTemperature, 4)
    );

  const totalHeatLossW =
    radiativeHeatLossW + conductiveHeatLeakW;

  const totalAvailableHeatW =
    internalHeatW +
    heaterPowerAvailableW +
    externalHeatW;

  const coldCaseThermalMarginW =
    totalAvailableHeatW - totalHeatLossW;

  return {
    isEvaluable: true,
    isEngineeringCertified: false,
    modelFidelity: 'first_order_cold_case_screening',

    assumptionStatus:
      model.assumptionStatus || 'UNSPECIFIED',

    effectiveInsulatedAreaM2: effectiveAreaM2,
    effectiveInsulationEmissivity: effectiveEmissivity,
    viewFactorToColdSink: viewFactor,

    equipmentTemperatureK: equipmentTemperature,
    coldSinkTemperatureK: sinkTemperature,

    conductiveHeatLeakW,
    radiativeHeatLossW,
    totalHeatLossW,

    internalWasteHeatW: internalHeatW,
    heaterPowerAvailableW,
    externalHeatGainW: externalHeatW,
    totalAvailableHeatW,

    coldCaseThermalMarginW,

    thermalMarginW: coldCaseThermalMarginW,
    isThermallyFeasible: coldCaseThermalMarginW >= 0,

    reason: null,
    missingInputs: [],

    limitations: [
      'First-order steady-state thermal balance.',
      'Internal waste heat must be independently estimated.',
      'Heater availability must be consistent with the electrical power budget.',
      'Conductive heat leakage is an assumed or measured input.',
      'Transient cooldown and warm-up time are not modelled.',
      'Positive margin does not prove that every instrument remains within its qualified operating temperature range.',
      'Detailed thermal networks and cryocooler performance are not modelled.',
    ],
  };
}
