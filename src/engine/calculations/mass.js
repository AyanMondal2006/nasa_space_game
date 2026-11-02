/**
 * Spacecraft Mass Budget Engine
 * Calculates dry mass breakdown, propellant requirements via Tsiolkovsky equation,
 * engineering design margin (NASA standard 20%), and verifies launch vehicle lift margins.
 */

import { CONSTANTS } from '../constants/physics.js';

export const DEFAULT_MASS_MARGIN_FRACTION = 0.20; // 20% standard aerospace mass growth allowance

/**
 * Calculates complete mass budget from selected subsystems and instruments.
 * 
 * @param {object} config - Spacecraft configuration
 * @param {object} config.bus - Bus structure component
 * @param {object} config.power - Power component (solar panels, battery)
 * @param {Array}  config.instruments - Array of scientific instruments
 * @param {object} config.comms - Communications subsystem
 * @param {object} config.adcs - Attitude determination and control subsystem
 * @param {object} config.computing - Onboard computer and data storage
 * @param {object} config.thermal - Thermal control subsystem
 * @param {object} config.propulsion - Propulsion system component
 * @param {number} config.requiredDeltaVMs - Required delta-V for mission maneuvers (m/s)
 * @param {number} [config.massMarginFraction=0.20] - Design margin fraction
 * @returns {object} Mass breakdown and totals
 */
export function calculateMassBudget(config) {
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

  // Individual subsystem masses
  const busMass = Number(bus?.massKg) || 0;
  const powerMass = (Number(power?.massKg) || 0) + (Number(battery?.massKg) || 0);
  const instrumentsMass = (instruments || []).reduce((acc, inst) => acc + (Number(inst?.massKg) || 0), 0);
  const commsMass = Number(comms?.massKg) || 0;
  const adcsMass = Number(adcs?.massKg) || 0;
  const computingMass = Number(computing?.massKg) || 0;
  const thermalMass = Number(thermal?.massKg) || 0;
  const propulsionDryMass = Number(propulsion?.massKg) || 0;

  // Total dry mass (spacecraft without propellant or growth margin)
  const dryMass = busMass +
    powerMass +
    instrumentsMass +
    commsMass +
    adcsMass +
    computingMass +
    thermalMass +
    propulsionDryMass;

  // Design mass margin (AIAA S-120-2006 standard)
  const massMargin = dryMass * massMarginFraction;
  const dryMassWithMargin = dryMass + massMargin;

  // Propellant mass calculation using Tsiolkovsky rocket equation:
  // Delta_v = Isp * g0 * ln(m_wet / m_dry) => m_wet = m_dry * exp(Delta_v / (Isp * g0))
  let propellantMass = 0;
  const ispSeconds = Number(propulsion?.ispSeconds) || 0;

  if (requiredDeltaVMs > 0 && ispSeconds > 0) {
    const effectiveExhaustVelocity = ispSeconds * CONSTANTS.g0;
    const massRatio = Math.exp(requiredDeltaVMs / effectiveExhaustVelocity);
    // Propellant needed to accelerate dry mass with margin
    propellantMass = dryMassWithMargin * (massRatio - 1);
  } else if (Number(propulsion?.initialPropellantKg) > 0) {
    // Fixed propellant load if specified
    propellantMass = Number(propulsion.initialPropellantKg);
  }

  // Total wet launch mass
  const totalLaunchMass = dryMassWithMargin + propellantMass;

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
    massMarginFraction,
    massMargin,
    dryMassWithMargin,
    propellantMass,
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
      { name: 'Design Margin (20%)', massKg: massMargin, category: 'margin' },
      { name: 'Propellant', massKg: propellantMass, category: 'propellant' },
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

  const capacityKg = Number(launchVehicle.payloadCapacityKg) || 0;
  const marginKg = capacityKg - totalLaunchMass;
  const marginPercent = capacityKg > 0 ? (marginKg / capacityKg) * 100 : 0;

  if (marginKg < 0) {
    return {
      isValid: false,
      capacityKg,
      launchMassKg: totalLaunchMass,
      marginKg,
      marginPercent,
      status: 'error',
      message: `Spacecraft mass (${totalLaunchMass.toFixed(1)} kg) exceeds ${launchVehicle.name} capacity (${capacityKg.toFixed(1)} kg) by ${Math.abs(marginKg).toFixed(1)} kg.`,
    };
  }

  if (marginPercent < 5) {
    return {
      isValid: true,
      capacityKg,
      launchMassKg: totalLaunchMass,
      marginKg,
      marginPercent,
      status: 'warning',
      message: `Payload margin is narrow (${marginPercent.toFixed(1)}%). Consider lighter components to avoid launch constraints.`,
    };
  }

  return {
    isValid: true,
    capacityKg,
    launchMassKg: totalLaunchMass,
    marginKg,
    marginPercent,
    status: 'optimal',
    message: `${launchVehicle.name} provides ample payload capacity (+${marginKg.toFixed(0)} kg, ${marginPercent.toFixed(1)}% margin).`,
  };
}
