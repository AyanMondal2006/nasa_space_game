/**
 * Mission Engineering Feasibility & Constraint Validation Engine
 * Evaluates full spacecraft configuration against launch vehicle capability,
 * orbital requirements, power balance, storage limits, and financial ceilings.
 * 
 * Every issue reports:
 * - title
 * - message (What is wrong)
 * - cause (Which configuration caused it)
 * - whyItMatters (Aerospace physical/operational consequence)
 * - remedy (Actionable engineering fixes)
 * - severity: 'error' (blocking) | 'warning' (non-blocking) | 'info'
 */

import { calculateCircularOrbit } from '../calculations/orbitalMechanics.js';
import { calculateMassBudget, checkLaunchVehicleCapacity } from '../calculations/mass.js';
import { calculatePowerBudget, MAX_RECOMMENDED_DOD } from '../calculations/power.js';
import { calculateBudget } from '../calculations/budget.js';
import { calculateDataBudget } from '../calculations/data.js';
import { calculateCommunicationsBudget } from '../calculations/communications.js';

export function validateMission(mission) {
  if (!mission) {
    return {
      isValid: false,
      errors: [{
        title: 'Mission Configuration Undefined',
        message: 'No mission data provided for validation.',
        cause: 'Empty mission object.',
        whyItMatters: 'Cannot simulate an unconfigured mission.',
        remedy: 'Select a mission campaign or create a new mission design.',
        severity: 'error',
      }],
      warnings: [],
      metrics: null,
    };
  }

  const {
    spacecraft = {},
    orbit: orbitConfig = null,
    launchVehicle = null,
    budgetLimitUSD = 200_000_000,
    durationDays = 180,
    destination = 'earth',
    deltaVRequiredMs = 0,
  } = mission;

  const errors = [];
  const warnings = [];

  // 1. Mandatory Subsystem Checks
  if (!spacecraft.bus) {
    errors.push({
      title: 'Missing Spacecraft Bus Structure',
      message: 'No structural spacecraft bus has been selected.',
      cause: 'Spacecraft configuration has null bus.',
      whyItMatters: 'Instruments, solar arrays, and thrusters have no structural mounting frame or primary load path.',
      remedy: 'Open the Spacecraft Laboratory and select a suitable smallsat or science bus.',
      severity: 'error',
    });
  }

  if (!spacecraft.power) {
    errors.push({
      title: 'Missing Electrical Power Generation Source',
      message: 'No solar array or radioisotope generator (RTG) selected.',
      cause: 'Power subsystem is empty.',
      whyItMatters: 'Avionics and scientific payloads cannot operate without generated electrical power.',
      remedy: 'Select deployable solar wings, body-mounted silicon panels, or an RTG in the Power subsystem.',
      severity: 'error',
    });
  }

  if (!spacecraft.battery) {
    errors.push({
      title: 'Missing Electrical Energy Storage (Battery)',
      message: 'No secondary rechargeable battery pack selected.',
      cause: 'Battery subsystem is empty.',
      whyItMatters: 'When the satellite enters planetary shadow (eclipse), lack of stored power causes immediate blackout and uncontrolled tumbling.',
      remedy: 'Add a space-qualified Li-Ion or LiFePO4 battery pack sized for your orbital eclipse duration.',
      severity: 'error',
    });
  }

  if (!spacecraft.instruments || spacecraft.instruments.length === 0) {
    errors.push({
      title: 'No Scientific Payloads Installed',
      message: 'The spacecraft carries zero scientific instruments.',
      cause: 'Instruments payload list is empty.',
      whyItMatters: 'A scientific spacecraft without instruments cannot fulfill any mission objectives or return data.',
      remedy: 'Select at least one imager, spectrometer, radiometer, or radar in the Scientific Payload section.',
      severity: 'error',
    });
  }

  if (!spacecraft.comms) {
    errors.push({
      title: 'Missing Communications Transceiver & Antenna',
      message: 'No radio or optical communication subsystem selected.',
      cause: 'Communications subsystem is unconfigured.',
      whyItMatters: 'Without an antenna and transmitter, science data cannot be downlinked to Earth ground stations and flight controllers cannot send commands.',
      remedy: 'Select an S-band, X-band, Ka-band, or laser optical communication terminal.',
      severity: 'error',
    });
  }

  if (!spacecraft.adcs) {
    errors.push({
      title: 'Missing Attitude Determination & Control (ADCS)',
      message: 'No ADCS stabilization hardware selected.',
      cause: 'ADCS subsystem is empty.',
      whyItMatters: 'Solar panels cannot track the Sun, antennas cannot point at Earth, and optical cameras cannot steady on surface targets.',
      remedy: 'Equip reaction wheels with star trackers or magnetic torquers in the ADCS tab.',
      severity: 'error',
    });
  }

  if (!launchVehicle) {
    errors.push({
      title: 'No Launch Vehicle Contract Selected',
      message: 'No rocket has been chosen to deploy the mission.',
      cause: 'Launch vehicle selector is empty.',
      whyItMatters: 'Spacecraft cannot reach destination orbit without a launch vehicle.',
      remedy: 'Select a compatible rocket (e.g. Electron, Falcon 9, Falcon Heavy) with sufficient lift capability.',
      severity: 'error',
    });
  }

  // 2. Destination Compatibility
  if (destination && destination !== 'earth' && spacecraft.adcs?.id === 'adcs-basic-magnetic') {
    errors.push({
      title: 'Incompatible ADCS Hardware for Deep Space',
      message: 'Magnetic torquers cannot operate at the selected destination.',
      cause: 'Selected basic magnetic ADCS for a Moon/Mars/Asteroid mission.',
      whyItMatters: 'The Moon, Mars, and asteroids lack a strong global dipolar magnetic field. Magnetic torquers produce zero stabilizing torque in these environments.',
      remedy: 'Upgrade ADCS to 3-Axis Reaction Wheels with Star Trackers or Control Moment Gyros.',
      severity: 'error',
    });
  }

  if (launchVehicle && destination && launchVehicle.maxPayloadMassByDestination) {
    const destMax = launchVehicle.maxPayloadMassByDestination[destination];
    if (destMax === 0 || destMax == null) {
      errors.push({
        title: 'Launch Vehicle Incompatible with Target Destination',
        message: `${launchVehicle.name} does not support interplanetary trajectories to ${destination}.`,
        cause: `Launch vehicle trajectory envelope is limited to LEO/Moon.`,
        whyItMatters: 'Small lifters cannot provide the escape velocity (C3) required for interplanetary transit.',
        remedy: 'Select a heavier interplanetary launch vehicle such as Falcon 9, Atlas V, or Falcon Heavy.',
        severity: 'error',
      });
    }
  }

  // 3. Physical Calculations & Quantitative Validations
  let orbitCalc = null;
  try {
    const alt = orbitConfig?.altitudeKm || 500;
    const inc = orbitConfig?.inclinationDeg || 45;
    orbitCalc = calculateCircularOrbit(destination, alt, inc);
  } catch (err) {
    errors.push({
      title: 'Invalid Orbit Parameters',
      message: err.message || 'Orbit altitude is inside planetary radius.',
      cause: 'Altitude parameter invalid.',
      whyItMatters: 'Trajectories through planetary surface result in immediate atmospheric crash.',
      remedy: 'Increase orbit altitude above surface atmosphere limits.',
      severity: 'error',
    });
  }

  // Calculate Mass
  const massMetrics = calculateMassBudget({
    bus: spacecraft.bus,
    power: spacecraft.power,
    battery: spacecraft.battery,
    instruments: spacecraft.instruments || [],
    comms: spacecraft.comms,
    adcs: spacecraft.adcs,
    computing: spacecraft.computing,
    thermal: spacecraft.thermal,
    propulsion: spacecraft.propulsion,
    requiredDeltaVMs: deltaVRequiredMs,
  });

  // Check Launch Capacity
  if (launchVehicle) {
    const destCapacity = launchVehicle.maxPayloadMassByDestination?.[destination] != null
      ? launchVehicle.maxPayloadMassByDestination[destination]
      : launchVehicle.payloadCapacityKg;
    
    const virtualLV = { ...launchVehicle, payloadCapacityKg: destCapacity };
    const lvCheck = checkLaunchVehicleCapacity(virtualLV, massMetrics.totalLaunchMass);
    
    if (!lvCheck.isValid) {
      errors.push({
        title: 'Launch Vehicle Payload Capacity Exceeded',
        message: lvCheck.message,
        cause: `Spacecraft wet launch mass with 20% margin is ${massMetrics.totalLaunchMass.toFixed(0)} kg, while ${launchVehicle.name} max capacity to ${destination} is ${destCapacity.toFixed(0)} kg.`,
        whyItMatters: 'Rocket will fail to achieve the required orbital injection velocity, resulting in mission loss.',
        remedy: 'Select a higher-capacity launch vehicle, remove non-essential instruments, choose a lighter bus, or optimize propellant requirements.',
        severity: 'error',
      });
    } else if (lvCheck.status === 'warning') {
      warnings.push({
        title: 'Narrow Launch Vehicle Mass Margin',
        message: lvCheck.message,
        cause: `Payload margin is under 5% of rocket limit.`,
        whyItMatters: 'Late-stage engineering design changes frequently cause mass growth that could exceed capacity.',
        remedy: 'Consider a higher-capacity booster or shedding auxiliary payload components.',
        severity: 'warning',
      });
    }
  }

  // Check Power & Battery Balance
  const powerMetrics = calculatePowerBudget({
    powerSource: spacecraft.power,
    battery: spacecraft.battery,
    instruments: spacecraft.instruments || [],
    comms: spacecraft.comms,
    adcs: spacecraft.adcs,
    computing: spacecraft.computing,
    thermal: spacecraft.thermal,
    orbit: orbitCalc,
    bodyId: destination,
  });

  if (powerMetrics.daylightPowerMarginW < 0) {
    errors.push({
      title: 'Negative Daylight Power Margin',
      message: `Solar array generates ${powerMetrics.daylightGenerationW.toFixed(0)} W, which is less than the continuous daytime load (${powerMetrics.daylightLoadW.toFixed(0)} W).`,
      cause: 'Instruments and subsystems consume more electrical power than the power source generates in sunlight.',
      whyItMatters: 'Spacecraft will experience brownouts even in direct sunlight, draining the battery in daytime.',
      remedy: 'Upgrade to larger deployable solar wings, switch to an RTG if operating in deep space, or reduce power-hungry instruments.',
      severity: 'error',
    });
  } else if (powerMetrics.daylightPowerMarginPercent < 15) {
    warnings.push({
      title: 'Low Solar Power Margin',
      message: `Daylight generation surplus is only ${powerMetrics.daylightPowerMarginPercent.toFixed(1)}% above daytime consumption.`,
      cause: 'Tight power generation margin.',
      whyItMatters: 'Solar cell degradation from cosmic radiation over multi-year missions will gradually trigger power deficits.',
      remedy: 'Increase solar array area to provide at least 25% design power margin.',
      severity: 'warning',
    });
  }

  if (powerMetrics.dodReached > 1.0) {
    errors.push({
      title: 'Battery Depletion During Planetary Eclipse',
      message: `Eclipse energy draw (${powerMetrics.energyConsumedEclipseWh.toFixed(0)} Wh) exceeds total installed battery capacity (${powerMetrics.totalBatteryCapacityWh.toFixed(0)} Wh).`,
      cause: 'Battery capacity is undersized for the duration of orbital eclipse.',
      whyItMatters: 'The spacecraft will completely lose power and reset its flight computers every time it passes through planetary shadow.',
      remedy: 'Install a higher capacity battery pack (e.g. 1,500 Wh or 4,500 Wh) in the Battery subsystem.',
      severity: 'error',
    });
  } else if (powerMetrics.dodReached > MAX_RECOMMENDED_DOD) {
    warnings.push({
      title: 'High Battery Depth-of-Discharge (DoD)',
      message: `Eclipse discharge reaches ${powerMetrics.dodPercent.toFixed(1)}% (exceeding recommended 70% threshold).`,
      cause: 'High energy consumption during eclipse relative to battery size.',
      whyItMatters: 'Deep cycling rapidly accelerates lithium-ion cell degradation and reduces operational mission lifetime.',
      remedy: 'Upgrade battery capacity or configure payload standby sleep modes during eclipse.',
      severity: 'warning',
    });
  }

  // Check Budget Ceiling
  const budgetMetrics = calculateBudget({
    spacecraft,
    launchVehicle,
    missionDurationDays: durationDays,
    budgetLimit: budgetLimitUSD,
  });

  if (budgetMetrics.remainingBudget < 0) {
    errors.push({
      title: 'Project Budget Ceiling Exceeded',
      message: `Estimated total mission cost is $${(budgetMetrics.totalCost / 1e6).toFixed(1)}M, exceeding the $${(budgetLimitUSD / 1e6).toFixed(1)}M budget ceiling by $${(Math.abs(budgetMetrics.remainingBudget) / 1e6).toFixed(1)}M.`,
      cause: 'Selected hardware, launch service, or operations exceed financial funding cap.',
      whyItMatters: 'A mission with funding deficits will fail programmatic review and cannot proceed to launch.',
      remedy: 'Select a more economical launch vehicle, replace expensive instruments, or streamline mission duration.',
      severity: 'error',
    });
  } else if (budgetMetrics.utilizationPercent > 95) {
    warnings.push({
      title: 'Tight Budget Contingency Reserve',
      message: `Budget utilization is ${budgetMetrics.utilizationPercent.toFixed(1)}%, leaving less than 5% unallocated financial reserve.`,
      cause: 'Hardware configuration costs closely approach the scenario budget cap.',
      whyItMatters: 'Any cost overruns during fabrication or test will breach programmatic reserves.',
      remedy: 'Consider cost optimization to retain a 10% safety reserve.',
      severity: 'warning',
    });
  }

  // Check Data Storage & Downlink
  const dataMetrics = calculateDataBudget({
    instruments: spacecraft.instruments || [],
    computing: spacecraft.computing,
    dutyCycleFraction: 0.5,
    maxContactGapHours: 12,
  });

  if (dataMetrics.accumulatedDataInGapMB > dataMetrics.storageCapacityMB) {
    errors.push({
      title: 'Onboard Solid-State Memory Overflow',
      message: `Instruments collect ${(dataMetrics.accumulatedDataInGapMB / 1024).toFixed(1)} GB between ground station contacts, exceeding the ${dataMetrics.storageCapacityGB} GB solid-state recorder capacity.`,
      cause: 'High instrument data generation combined with limited onboard computer storage.',
      whyItMatters: 'The solid-state recorder will overwrite un-downlinked observations, resulting in permanent science data loss.',
      remedy: 'Upgrade computing subsystem to 128 GB or 512 GB NVMe Solid-State Recorder, or reduce payload duty cycle.',
      severity: 'error',
    });
  }

  const commsMetrics = calculateCommunicationsBudget({
    comms: spacecraft.comms,
    bodyId: destination,
    altitudeKm: orbitConfig?.altitudeKm || 500,
    dailyDataGeneratedMB: dataMetrics.dailyDataVolumeMB,
  });

  if (commsMetrics.netDailyBacklogMB > 0) {
    warnings.push({
      title: 'Science Telemetry Downlink Bottleneck',
      message: `Instruments collect ${(dataMetrics.dailyDataVolumeMB / 1024).toFixed(1)} GB/day, but downlink capacity is ${(commsMetrics.dailyDownlinkCapacityGB).toFixed(1)} GB/day. Science backlog accumulates at +${(commsMetrics.netDailyBacklogMB / 1024).toFixed(1)} GB/day.`,
      cause: 'Antenna bandwidth is insufficient for the high volume of science data generated.',
      whyItMatters: 'Data will pile up on the spacecraft over time, eventually halting new observations.',
      remedy: 'Upgrade to a high-gain Ka-band dish or optical laser terminal, or select higher compression computing avionics.',
      severity: 'warning',
    });
  }

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
