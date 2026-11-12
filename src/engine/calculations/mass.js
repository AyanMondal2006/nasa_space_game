
/**
 * Spacecraft Mass Budget Engine
 *
 * Calculates dry mass, engineering mass margin, required propellant,
 * configured propellant load, theoretical delta-V capability, and launch mass.
 *
 * Delta-V capability is calculated with the ideal Tsiolkovsky rocket equation.
 * This is a first-order educational model; it does not model staging, gravity
 * losses, finite-burn guidance, propellant residuals, or tank pressurization.
 */

import { CONSTANTS } from '../constants/physics.js';

export const DEFAULT_MASS_MARGIN_FRACTION = 0.20;

function finiteNonNegative(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : fallback;
}

function hasFiniteNonNegativeValue(value) {
  if (value === null || value === undefined || value === '') return false;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0;
}

/**
 * Calculates complete mass budget from selected subsystems and instruments.
 *
 * initialPropellantKg, when supplied by the selected propulsion component,
 * represents the configured propellant load. The engine calculates required
 * propellant separately so that the design can be checked against that load.
 *
 * @param {object} config
 * @returns {object} Mass breakdown, propellant requirement, and delta-V capability.
 */
export function calculateMassBudget(config = {}) {
  const {
    bus = null,
    power = null,
    battery = null,
    instruments = [],
    comms = null,
    adcs = null,
    computing = null,
    thermal = null,
    propulsion = null,
    requiredDeltaVMs = 0,
    massMarginFraction = DEFAULT_MASS_MARGIN_FRACTION,
  } = config || {};

  const safeRequiredDeltaVMs = finiteNonNegative(requiredDeltaVMs, 0);

  const parsedMarginFraction = Number(massMarginFraction);

  const safeMassMarginFraction =
    Number.isFinite(parsedMarginFraction) && parsedMarginFraction >= 0
      ? parsedMarginFraction
      : DEFAULT_MASS_MARGIN_FRACTION;

  // Individual subsystem masses.
  const busMass = finiteNonNegative(bus?.massKg);

  const powerMass =
    finiteNonNegative(power?.massKg) +
    finiteNonNegative(battery?.massKg);

  const safeInstruments = Array.isArray(instruments)
    ? instruments
    : [];

  const instrumentsMass = safeInstruments.reduce(
    (acc, instrument) => acc + finiteNonNegative(instrument?.massKg),
    0
  );

  const commsMass = finiteNonNegative(comms?.massKg);
  const adcsMass = finiteNonNegative(adcs?.massKg);
  const computingMass = finiteNonNegative(computing?.massKg);
  const thermalMass = finiteNonNegative(thermal?.massKg);
  const propulsionDryMass = finiteNonNegative(propulsion?.massKg);

  // Total dry mass and engineering growth allowance.
  const dryMass =
    busMass +
    powerMass +
    instrumentsMass +
    commsMass +
    adcsMass +
    computingMass +
    thermalMass +
    propulsionDryMass;

  const massMargin = dryMass * safeMassMarginFraction;
  const dryMassWithMargin = dryMass + massMargin;

  const ispSeconds = finiteNonNegative(propulsion?.ispSeconds);

  const configuredPropellantValue = propulsion?.initialPropellantKg;

  const hasConfiguredPropellantLoad =
    hasFiniteNonNegativeValue(configuredPropellantValue);

  const configuredPropellantMassKg = hasConfiguredPropellantLoad
    ? Number(configuredPropellantValue)
    : null;

  // Required propellant for the requested mission delta-V.
  let requiredPropellantMassKg = 0;

  if (safeRequiredDeltaVMs > 0) {
    if (ispSeconds > 0 && dryMassWithMargin > 0) {
      const effectiveExhaustVelocity = ispSeconds * CONSTANTS.g0;

      requiredPropellantMassKg =
        dryMassWithMargin *
        Math.expm1(
          safeRequiredDeltaVMs / effectiveExhaustVelocity
        );
    } else {
      requiredPropellantMassKg = null;
    }
  }

  // Use configured propellant when available.
  // Otherwise retain the legacy propellant-sizing behavior.
  const propellantMass = hasConfiguredPropellantLoad
    ? configuredPropellantMassKg
    : (requiredPropellantMassKg ?? 0);

  const totalLaunchMass = dryMassWithMargin + propellantMass;

  // Theoretical delta-V capability from configured propellant.
  let availableDeltaVMs = null;

  if (
    hasConfiguredPropellantLoad &&
    ispSeconds > 0 &&
    dryMassWithMargin > 0
  ) {
    const effectiveExhaustVelocity = ispSeconds * CONSTANTS.g0;

    availableDeltaVMs =
      effectiveExhaustVelocity *
      Math.log1p(
        configuredPropellantMassKg / dryMassWithMargin
      );
  }

  const deltaVFeasible = availableDeltaVMs === null
    ? null
    : availableDeltaVMs + 1e-9 >= safeRequiredDeltaVMs;

  const propellantMarginKg =
    hasConfiguredPropellantLoad &&
    requiredPropellantMassKg !== null
      ? configuredPropellantMassKg - requiredPropellantMassKg
      : null;

  return {
    busMass,
    powerMass,
    instrumentsMass,
    commsMass,
    adcsMass,
    computingMass,
    thermalMass,
    propulsionDryMass,

    dryMass,
    massMarginFraction: safeMassMarginFraction,
    massMargin,
    dryMassWithMargin,

    ispSeconds,
    requiredDeltaVMs: safeRequiredDeltaVMs,
    requiredPropellantMassKg,
    configuredPropellantMassKg,
    hasConfiguredPropellantLoad,
    propellantMass,
    propellantMarginKg,

    availableDeltaVMs,
    deltaVFeasible,

    totalLaunchMass,

    breakdown: [
      { name: 'Bus Structure', massKg: busMass, category: 'bus' },
      { name: 'Power & Batteries', massKg: powerMass, category: 'power' },
      { name: 'Scientific Payload', massKg: instrumentsMass, category: 'payload' },
      { name: 'Communications', massKg: commsMass, category: 'comms' },
      { name: 'ADCS / Pointing', massKg: adcsMass, category: 'adcs' },
      { name: 'Onboard Computing', massKg: computingMass, category: 'computing' },
      { name: 'Thermal Control', massKg: thermalMass, category: 'thermal' },
      { name: 'Propulsion (Dry)', massKg: propulsionDryMass, category: 'propulsion' },
      { name: 'Design Margin', massKg: massMargin, category: 'margin' },
      { name: 'Configured Propellant', massKg: propellantMass, category: 'propellant' },
    ],
  };
}

/**
 * Checks spacecraft launch mass against launch vehicle maximum payload capacity.
 */
export function checkLaunchVehicleCapacity(launchVehicle, totalLaunchMass) {
  if (!launchVehicle) {
    return {
      isValid: false,
      capacityKg: 0,
      launchMassKg: totalLaunchMass,
      marginKg: 0,
      marginPercent: 0,
      status: 'error',
      message: 'No launch vehicle selected',
    };
  }

  const capacityKg = finiteNonNegative(
    launchVehicle.payloadCapacityKg
  );

  const safeLaunchMassKg = finiteNonNegative(totalLaunchMass);

  const marginKg = capacityKg - safeLaunchMassKg;

  const marginPercent = capacityKg > 0
    ? (marginKg / capacityKg) * 100
    : 0;

  if (marginKg < 0) {
    return {
      isValid: false,
      capacityKg,
      launchMassKg: safeLaunchMassKg,
      marginKg,
      marginPercent,
      status: 'error',
      message: `Spacecraft mass (${safeLaunchMassKg.toFixed(1)} kg) exceeds ${launchVehicle.name || 'the selected launch vehicle'} capacity (${capacityKg.toFixed(1)} kg) by ${Math.abs(marginKg).toFixed(1)} kg.`,
    };
  }

  if (marginPercent < 5) {
    return {
      isValid: true,
      capacityKg,
      launchMassKg: safeLaunchMassKg,
      marginKg,
      marginPercent,
      status: 'warning',
      message: `Payload margin is narrow (${marginPercent.toFixed(1)}%). Consider lighter components to avoid launch constraints.`,
    };
  }

  return {
    isValid: true,
    capacityKg,
    launchMassKg: safeLaunchMassKg,
    marginKg,
    marginPercent,
    status: 'optimal',
    message: `${launchVehicle.name || 'Selected launch vehicle'} provides ample payload capacity (+${marginKg.toFixed(0)} kg, ${marginPercent.toFixed(1)}% margin).`,
  };
}
