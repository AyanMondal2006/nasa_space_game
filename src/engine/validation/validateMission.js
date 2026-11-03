/**
 * Mission Engineering Feasibility & Constraint Validation Engine
 *
 * Evaluates spacecraft configuration against launch vehicle capability,
 * orbital requirements, power balance, storage limits, communications,
 * and financial ceilings.
 *
 * Each issue reports:
 * - title
 * - message
 * - cause
 * - whyItMatters
 * - remedy
 * - severity: 'error' | 'warning' | 'info'
 *
 * The result shape is intentionally kept compatible with the existing
 * MissionContext, MissionDesignerPage, ValidationAlerts and other consumers.
 */

import { calculateCircularOrbit } from '../calculations/orbitalMechanics.js';
import { calculateMassBudget, checkLaunchVehicleCapacity } from '../calculations/mass.js';
import { calculatePowerBudget, MAX_RECOMMENDED_DOD } from '../calculations/power.js';
import { calculateBudget } from '../calculations/budget.js';
import { calculateDataBudget } from '../calculations/data.js';
import { calculateCommunicationsBudget } from '../calculations/communications.js';

const DEFAULT_ORBIT_ALTITUDE_KM = 500;
const DEFAULT_ORBIT_INCLINATION_DEG = 45;
const DEFAULT_BUDGET_LIMIT_USD = 200_000_000;
const DEFAULT_MISSION_DURATION_DAYS = 180;
const VALIDATION_DATA_DUTY_CYCLE = 0.6;
const DEFAULT_MAX_CONTACT_GAP_HOURS = 12;

function makeIssue({ title, message, cause, whyItMatters, remedy, severity = 'error' }) {
  return { title, message, cause, whyItMatters, remedy, severity };
}

function isFiniteNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

export function validateMission(mission) {
  if (!mission || typeof mission !== 'object' || Array.isArray(mission)) {
    return {
      isValid: false,
      errors: [makeIssue({
        title: 'Mission Configuration Undefined',
        message: 'No valid mission object was provided for validation.',
        cause: 'Mission input is null, missing, or is not an object.',
        whyItMatters: 'The mission cannot be evaluated or simulated without a valid configuration.',
        remedy: 'Select a mission campaign or create a valid mission design.',
      })],
      warnings: [],
      metrics: null,
    };
  }

  const rawSpacecraft = mission.spacecraft;
  // Explicit null is not handled by destructuring defaults. Normalize it to
  // an empty object so mandatory-subsystem checks return structured errors.
  const spacecraft = rawSpacecraft && typeof rawSpacecraft === 'object' && !Array.isArray(rawSpacecraft)
    ? rawSpacecraft
    : {};

  const orbitConfig = mission.orbit ?? null;
  const launchVehicle = mission.launchVehicle ?? null;
  const budgetLimitUSD = mission.budgetLimitUSD ?? DEFAULT_BUDGET_LIMIT_USD;
  const durationDays = mission.durationDays ?? DEFAULT_MISSION_DURATION_DAYS;
  const destination = mission.destination ?? 'earth';
  const deltaVRequiredMs = mission.deltaVRequiredMs ?? 0;
  const instruments = Array.isArray(spacecraft.instruments) ? spacecraft.instruments : [];

  const errors = [];
  const warnings = [];

  if (rawSpacecraft == null || typeof rawSpacecraft !== 'object' || Array.isArray(rawSpacecraft)) {
    errors.push(makeIssue({
      title: 'Invalid Spacecraft Configuration',
      message: 'The spacecraft configuration is missing or is not a valid object.',
      cause: 'mission.spacecraft must be an object containing the spacecraft subsystems.',
      whyItMatters: 'Mass, power, data, communication, and launch feasibility cannot be evaluated reliably.',
      remedy: 'Create a spacecraft configuration and select the required subsystems.',
    }));
  }

  // 1. Mandatory subsystem checks
  if (!spacecraft.bus) {
    errors.push(makeIssue({
      title: 'Missing Spacecraft Bus Structure',
      message: 'No structural spacecraft bus has been selected.',
      cause: 'Spacecraft configuration has no bus.',
      whyItMatters: 'Instruments, solar arrays, and thrusters have no structural mounting frame or primary load path.',
      remedy: 'Open the Spacecraft Laboratory and select a suitable smallsat or science bus.',
    }));
  }

  if (!spacecraft.power) {
    errors.push(makeIssue({
      title: 'Missing Electrical Power Generation Source',
      message: 'No solar array or radioisotope generator (RTG) selected.',
      cause: 'Power subsystem is empty.',
      whyItMatters: 'Avionics and scientific payloads cannot operate without generated electrical power.',
      remedy: 'Select deployable solar wings, body-mounted solar panels, or an RTG in the Power subsystem.',
    }));
  }

  const isRTGPowered = Boolean(spacecraft.power?.isRTG);
  const configuredBatteryCapacityWh = spacecraft.battery?.capacityWh;
  const hasUsableBattery = Boolean(
    spacecraft.battery &&
    configuredBatteryCapacityWh != null &&
    isFiniteNonNegative(configuredBatteryCapacityWh) &&
    Number(configuredBatteryCapacityWh) > 0
  );

  // An RTG can provide continuous electrical generation, so a battery is
  // optional for RTG missions. A solar-powered spacecraft still needs storage
  // for eclipse operations; a zero-capacity battery is not usable storage.
  if (!hasUsableBattery && !isRTGPowered) {
    errors.push(makeIssue({
      title: 'Missing Electrical Energy Storage (Battery)',
      message: 'No usable secondary battery pack has been selected.',
      cause: 'A solar-powered spacecraft has no battery with positive usable capacity.',
      whyItMatters: 'Solar-powered spacecraft cannot maintain their electrical loads during planetary eclipse without stored energy.',
      remedy: 'Add a space-qualified battery pack sized for the expected orbital eclipse duration.',
    }));
  }

  if (instruments.length === 0) {
    errors.push(makeIssue({
      title: 'No Scientific Payloads Installed',
      message: 'The spacecraft carries zero scientific instruments.',
      cause: 'The instruments payload list is missing, invalid, or empty.',
      whyItMatters: 'A scientific spacecraft without instruments cannot fulfill scientific mission objectives or return observations.',
      remedy: 'Select at least one imager, spectrometer, radiometer, or radar in the Scientific Payload section.',
    }));
  } else if (!Array.isArray(spacecraft.instruments)) {
    errors.push(makeIssue({
      title: 'Invalid Scientific Payload Configuration',
      message: 'The scientific instruments configuration must be an array.',
      cause: 'spacecraft.instruments is not an array.',
      whyItMatters: 'Instrument mass, power demand, and data generation cannot be calculated reliably.',
      remedy: 'Select one or more instruments using the Scientific Payload selector.',
    }));
  }

  if (!spacecraft.comms) {
    errors.push(makeIssue({
      title: 'Missing Communications Transceiver & Antenna',
      message: 'No radio or optical communication subsystem selected.',
      cause: 'Communications subsystem is unconfigured.',
      whyItMatters: 'Without communication hardware, science data cannot be downlinked and flight controllers cannot send commands.',
      remedy: 'Select an S-band, X-band, Ka-band, or optical communication terminal.',
    }));
  }

  if (!spacecraft.adcs) {
    errors.push(makeIssue({
      title: 'Missing Attitude Determination & Control (ADCS)',
      message: 'No ADCS stabilization hardware selected.',
      cause: 'ADCS subsystem is empty.',
      whyItMatters: 'Solar panels, antennas, and optical instruments may be unable to maintain the required pointing.',
      remedy: 'Equip the spacecraft with suitable reaction wheels, star trackers, or other compatible ADCS hardware.',
    }));
  }

  if (!launchVehicle) {
    errors.push(makeIssue({
      title: 'No Launch Vehicle Contract Selected',
      message: 'No launch vehicle has been chosen to deploy the mission.',
      cause: 'Launch vehicle selector is empty.',
      whyItMatters: 'The spacecraft cannot reach its target orbit without a compatible launch service.',
      remedy: 'Select a compatible launch vehicle with sufficient payload capability for the target destination.',
    }));
  }

  // 2. Destination compatibility
  if (destination && destination !== 'earth' && spacecraft.adcs?.id === 'adcs-basic-magnetic') {
    errors.push(makeIssue({
      title: 'Incompatible ADCS Hardware for Deep Space',
      message: 'Magnetic torquers may not provide adequate control at the selected destination.',
      cause: 'Basic magnetic ADCS selected for a Moon, Mars, or asteroid mission.',
      whyItMatters: 'Magnetic torquers rely on an ambient magnetic field and may not provide adequate control authority in these environments.',
      remedy: 'Select a deep-space-compatible three-axis control system, such as reaction wheels with suitable attitude sensors.',
    }));
  }

  if (launchVehicle && destination && launchVehicle.maxPayloadMassByDestination) {
    const destinationMaxPayload = launchVehicle.maxPayloadMassByDestination[destination];
    if (destinationMaxPayload === 0 || destinationMaxPayload == null) {
      errors.push(makeIssue({
        title: 'Launch Vehicle Incompatible with Target Destination',
        message: `${launchVehicle.name || 'Selected launch vehicle'} has no configured payload capability for ${destination}.`,
        cause: 'The launch vehicle destination-capability table has no positive payload allowance for this destination.',
        whyItMatters: 'The selected launch service may not provide the performance required for the destination trajectory.',
        remedy: 'Select a launch vehicle with a documented payload capability for the chosen destination.',
      }));
    }
  }

  // 3. Orbital calculation. Nullish coalescing preserves valid zero-degree
  // inclination rather than replacing it with the default inclination.
  let orbitCalc = null;
  const altitudeKm = orbitConfig?.altitudeKm ?? DEFAULT_ORBIT_ALTITUDE_KM;
  const inclinationDeg = orbitConfig?.inclinationDeg ?? DEFAULT_ORBIT_INCLINATION_DEG;

  try {
    if (!Number.isFinite(Number(altitudeKm)) || Number(altitudeKm) < 0) {
      throw new Error('Orbit altitude must be a finite non-negative number.');
    }
    if (!Number.isFinite(Number(inclinationDeg)) || Number(inclinationDeg) < 0 || Number(inclinationDeg) > 180) {
      throw new Error('Orbit inclination must be between 0 and 180 degrees.');
    }

    orbitCalc = calculateCircularOrbit(destination, Number(altitudeKm), Number(inclinationDeg));
  } catch (err) {
    errors.push(makeIssue({
      title: 'Invalid Orbit Parameters',
      message: err.message || 'The supplied orbit parameters are invalid.',
      cause: 'Altitude or inclination is outside the supported input range, or the orbit calculation failed.',
      whyItMatters: 'An invalid orbit cannot be used for mission operations or reliable orbital resource calculations.',
      remedy: "Choose a valid orbital altitude above the body's surface and an inclination between 0 and 180 degrees.",
    }));
  }

  // 4. Mass calculation
  const massMetrics = calculateMassBudget({
    bus: spacecraft.bus,
    power: spacecraft.power,
    battery: spacecraft.battery,
    instruments,
    comms: spacecraft.comms,
    adcs: spacecraft.adcs,
    computing: spacecraft.computing,
    thermal: spacecraft.thermal,
    propulsion: spacecraft.propulsion,
    requiredDeltaVMs: deltaVRequiredMs,
  });

  // 5. Launch vehicle payload capacity
  if (launchVehicle) {
    const destinationCapacity = launchVehicle.maxPayloadMassByDestination?.[destination] != null
      ? launchVehicle.maxPayloadMassByDestination[destination]
      : launchVehicle.payloadCapacityKg;

    const virtualLaunchVehicle = {
      ...launchVehicle,
      payloadCapacityKg: destinationCapacity,
    };

    const launchCapacityCheck = checkLaunchVehicleCapacity(
      virtualLaunchVehicle,
      massMetrics.totalLaunchMass
    );

    if (!launchCapacityCheck.isValid) {
      errors.push(makeIssue({
        title: 'Launch Vehicle Payload Capacity Exceeded',
        message: launchCapacityCheck.message,
        cause: `Spacecraft wet launch mass with design margin is ${Number(massMetrics.totalLaunchMass).toFixed(0)} kg, while ${launchVehicle.name || 'the selected launch vehicle'} capacity for ${destination} is ${Number(destinationCapacity).toFixed(0)} kg.`,
        whyItMatters: 'The launch vehicle may not provide sufficient performance to achieve the required injection trajectory.',
        remedy: 'Select a higher-capacity launch vehicle, remove non-essential instruments, choose a lighter bus, or review propulsion requirements.',
      }));
    } else if (launchCapacityCheck.status === 'warning') {
      warnings.push(makeIssue({
        title: 'Narrow Launch Vehicle Mass Margin',
        message: launchCapacityCheck.message,
        cause: 'Payload margin is under 5% of the launch vehicle capacity.',
        whyItMatters: 'Late-stage design changes can increase mass and exceed launch capability.',
        remedy: 'Consider a higher-capacity launch vehicle or reduce non-essential spacecraft mass.',
        severity: 'warning',
      }));
    }
  }

  // 6. Power and battery balance
  const powerMetrics = calculatePowerBudget({
    powerSource: spacecraft.power,
    battery: spacecraft.battery,
    instruments,
    comms: spacecraft.comms,
    adcs: spacecraft.adcs,
    computing: spacecraft.computing,
    thermal: spacecraft.thermal,
    orbit: orbitCalc,
    bodyId: destination,
  });

  if (powerMetrics.daylightPowerMarginW < 0) {
    errors.push(makeIssue({
      title: 'Negative Daylight Power Margin',
      message: `Power generation (${Number(powerMetrics.daylightGenerationW).toFixed(0)} W) is below the daytime load (${Number(powerMetrics.daylightLoadW).toFixed(0)} W).`,
      cause: 'The selected power source cannot meet the calculated daytime electrical load.',
      whyItMatters: 'The spacecraft may experience power deficits even in sunlight.',
      remedy: 'Increase power generation, select a suitable RTG, or reduce the electrical load.',
    }));
  } else if (powerMetrics.daylightPowerMarginPercent < 15) {
    warnings.push(makeIssue({
      title: 'Low Solar Power Margin',
      message: `Daylight generation surplus is only ${Number(powerMetrics.daylightPowerMarginPercent).toFixed(1)}% above daytime consumption.`,
      cause: 'The available power-generation margin is small.',
      whyItMatters: 'Degradation and operational changes may reduce available power margin over the mission lifetime.',
      remedy: 'Increase array capacity or reduce payload and subsystem power consumption.',
      severity: 'warning',
    }));
  }

  // A battery-free RTG mission must have enough continuous generation for
  // the worst modelled operating mode, including transmitter peak load.
  const isBatteryFreeRTGMission = isRTGPowered && !hasUsableBattery;
  if (isBatteryFreeRTGMission) {
    const worstCaseRequiredPowerW = Math.max(
      Number(powerMetrics.daylightLoadW) || 0,
      Number(powerMetrics.eclipseLoadW) || 0,
      Number(powerMetrics.peakLoadW) || 0
    );
    const continuousRTGPowerW = Math.min(
      Number(powerMetrics.daylightGenerationW) || 0,
      Number(powerMetrics.eclipseGenerationW) || 0
    );

    if (continuousRTGPowerW < worstCaseRequiredPowerW) {
      errors.push(makeIssue({
        title: 'Insufficient RTG Power for Battery-Free Operation',
        message: `RTG generation (${continuousRTGPowerW.toFixed(1)} W) is below the worst modelled operating load (${worstCaseRequiredPowerW.toFixed(1)} W).`,
        cause: 'The battery-free RTG configuration does not provide enough continuous power for all modelled operating modes.',
        whyItMatters: 'Without a battery reserve, any sustained power deficit can cause the spacecraft to lose electrical power.',
        remedy: 'Select a higher-output RTG, reduce subsystem and instrument loads, or install a suitable battery reserve.',
      }));
    }
  }

  // Battery depth-of-discharge checks apply to battery-dependent spacecraft.
  // RTG-powered spacecraft are evaluated against continuous RTG output above.
  if (!isRTGPowered && powerMetrics.dodReached > 1.0) {
    errors.push(makeIssue({
      title: 'Battery Depletion During Planetary Eclipse',
      message: `Eclipse energy draw (${Number(powerMetrics.energyConsumedEclipseWh).toFixed(0)} Wh) exceeds installed battery capacity (${Number(powerMetrics.totalBatteryCapacityWh).toFixed(0)} Wh).`,
      cause: 'Battery capacity is undersized for the modelled orbital eclipse duration.',
      whyItMatters: 'The spacecraft may lose electrical power during planetary shadow.',
      remedy: 'Install a higher-capacity battery or reduce eclipse-mode electrical loads.',
    }));
  } else if (!isRTGPowered && powerMetrics.dodReached > MAX_RECOMMENDED_DOD) {
    warnings.push(makeIssue({
      title: 'High Battery Depth-of-Discharge (DoD)',
      message: `Eclipse discharge reaches ${Number(powerMetrics.dodPercent).toFixed(1)}%, exceeding the recommended ${(MAX_RECOMMENDED_DOD * 100).toFixed(0)}% threshold.`,
      cause: 'Eclipse energy consumption is high relative to installed battery capacity.',
      whyItMatters: 'Deep cycling can accelerate battery degradation and reduce usable capacity.',
      remedy: 'Increase battery capacity or configure lower-power payload modes during eclipse.',
      severity: 'warning',
    }));
  }

  // 7. Budget ceiling
  const budgetMetrics = calculateBudget({
    spacecraft,
    launchVehicle,
    missionDurationDays: durationDays,
    budgetLimit: budgetLimitUSD,
  });

  if (budgetMetrics.remainingBudget < 0) {
    errors.push(makeIssue({
      title: 'Project Budget Ceiling Exceeded',
      message: `Estimated mission cost is $${(budgetMetrics.totalCost / 1e6).toFixed(1)}M, exceeding the $${(budgetLimitUSD / 1e6).toFixed(1)}M budget ceiling by $${(Math.abs(budgetMetrics.remainingBudget) / 1e6).toFixed(1)}M.`,
      cause: 'Selected hardware, launch service, or operations exceed the configured funding limit.',
      whyItMatters: 'A mission whose estimated cost exceeds its funding ceiling is not programmatically feasible under this scenario.',
      remedy: 'Select more economical hardware or launch services, or review mission duration and scope.',
    }));
  } else if (budgetMetrics.utilizationPercent > 95) {
    warnings.push(makeIssue({
      title: 'Tight Budget Contingency Reserve',
      message: `Budget utilization is ${Number(budgetMetrics.utilizationPercent).toFixed(1)}%, leaving less than 5% unallocated reserve.`,
      cause: 'Estimated mission costs closely approach the scenario budget limit.',
      whyItMatters: 'Cost increases may exceed the available contingency reserve.',
      remedy: 'Reduce costs to preserve a reasonable programmatic contingency.',
      severity: 'warning',
    }));
  }

  // 8. Data storage and downlink. Keep the duty cycle consistent with the
  // simulation engine's current 60% data-generation assumption.
  const dataMetrics = calculateDataBudget({
    instruments,
    computing: spacecraft.computing,
    dutyCycleFraction: VALIDATION_DATA_DUTY_CYCLE,
    maxContactGapHours: DEFAULT_MAX_CONTACT_GAP_HOURS,
  });

  if (dataMetrics.accumulatedDataInGapMB > dataMetrics.storageCapacityMB) {
    errors.push(makeIssue({
      title: 'Onboard Solid-State Memory Overflow',
      message: `Instruments collect ${(dataMetrics.accumulatedDataInGapMB / 1024).toFixed(1)} GB between ground-station contacts, exceeding the ${dataMetrics.storageCapacityGB} GB recorder capacity.`,
      cause: 'Data accumulated between contacts exceeds available onboard storage.',
      whyItMatters: 'New observations may be dropped when the onboard recorder is full.',
      remedy: 'Increase storage capacity, reduce instrument duty cycle, or improve downlink opportunities.',
    }));
  }

  // 9. Communication/downlink capacity
  const commsMetrics = calculateCommunicationsBudget({
    comms: spacecraft.comms,
    bodyId: destination,
    altitudeKm: altitudeKm,
    dailyDataGeneratedMB: dataMetrics.dailyDataVolumeMB,
  });

  if (commsMetrics.netDailyBacklogMB > 0) {
    warnings.push(makeIssue({
      title: 'Science Telemetry Downlink Bottleneck',
      message: `Instruments generate ${(dataMetrics.dailyDataVolumeMB / 1024).toFixed(1)} GB/day, while modelled downlink capacity is ${Number(commsMetrics.dailyDownlinkCapacityGB).toFixed(1)} GB/day. The estimated backlog grows by ${(commsMetrics.netDailyBacklogMB / 1024).toFixed(1)} GB/day.`,
      cause: 'The configured communication capacity is below the estimated daily science-data generation.',
      whyItMatters: 'Untransmitted data accumulates onboard and can eventually exhaust recorder capacity.',
      remedy: 'Increase communication capacity or contact opportunities, improve compression, or reduce data generation.',
      severity: 'warning',
    }));
  }

  // Preserve the existing public result structure used by the UI.
  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    metrics: {
      mass: massMetrics,
      power: powerMetrics,
      budget: budgetMetrics,
      data: dataMetrics,
      comms: commsMetrics,
      orbit: orbitCalc,
    },
  };
}
