/**
 * Spacecraft Power & Energy Balance Engine
 * Evaluates instantaneous power (Watts) and integrated orbital energy balance (Watt-hours),
 * eclipse discharge depth (DoD), and daylight battery replenishment capability.
 */

import { CELESTIAL_BODIES } from '../constants/physics.js';

export const MAX_RECOMMENDED_DOD = 0.70; // 70% Maximum Depth of Discharge for spaceflight Li-Ion battery longevity

/**
 * Calculates power generation, consumption, and day/night energy balance.
 * 
 * @param {object} params
 * @param {object} params.powerSource - Solar panels or RTG
 * @param {object} params.battery - Battery storage module
 * @param {Array}  params.instruments - Active scientific payload instruments
 * @param {object} params.comms - Communication subsystem
 * @param {object} params.adcs - ADCS subsystem
 * @param {object} params.computing - Computing subsystem
 * @param {object} params.thermal - Thermal subsystem
 * @param {object} params.orbit - Orbit parameters (period, eclipse duration)
 * @param {string} params.bodyId - Target celestial body
 * @returns {object} Power budget and energy balance
 */
export function calculatePowerBudget({
  powerSource,
  battery,
  instruments = [],
  comms,
  adcs,
  computing,
  thermal,
  orbit,
  bodyId = 'earth',
}) {
  const body = CELESTIAL_BODIES[bodyId] || CELESTIAL_BODIES.earth;
  const solarDistanceAU = body.solarDistanceAU || 1.0;

  // 1. Generation Capability
  let daylightGenerationW = 0;
  let eclipseGenerationW = 0;

  if (powerSource?.isRTG) {
    // Radioisotope Thermoelectric Generators produce constant thermal decay power day and night
    daylightGenerationW = Number(powerSource.generationW) || 0;
    eclipseGenerationW = daylightGenerationW;
  } else {
    // Solar array power scales with inverse-square law of distance to Sun
    const nominalPowerW = Number(powerSource?.generationW) || 0;
    const distanceFactor = 1.0 / Math.pow(solarDistanceAU, 2);
    daylightGenerationW = nominalPowerW * distanceFactor;
    eclipseGenerationW = 0; // No solar power in planetary shadow
  }

  // 2. Continuous Subsystem Consumption
  const computingPowerW = Number(computing?.powerConsumptionW) || 0;
  const adcsPowerW = Number(adcs?.powerConsumptionW) || 0;
  const thermalPowerW = Number(thermal?.powerConsumptionW) || 0;
  const commsStandbyPowerW = (Number(comms?.powerConsumptionW) || 0) * 0.3; // 30% in standby
  const commsTransmitPowerW = Number(comms?.powerConsumptionW) || 0;

  const busBasePowerW = computingPowerW + adcsPowerW + thermalPowerW + commsStandbyPowerW;

  // Instruments consumption
  const instrumentsPowerW = (instruments || []).reduce(
    (acc, inst) => acc + (Number(inst.powerConsumptionW) || 0),
    0
  );

  // Operational power modes
  // Mode A: Science daylight observation mode
  const daylightLoadW = busBasePowerW + instrumentsPowerW;

  // Mode B: Peak transmission mode (Bus + Science + Full Transmitter)
  const peakLoadW = busBasePowerW + instrumentsPowerW + commsTransmitPowerW;

  // Mode C: Eclipse survival mode (Instruments in low-power or active, bus running)
  const eclipseLoadW = busBasePowerW + (instrumentsPowerW * 0.7); // 70% payload standby

  // 3. Orbital Energy Balance (Watt-hours)
  const orbitalPeriodSec = orbit?.periodSeconds || 5400; // default 90 min LEO
  const eclipseDurationSec = orbit?.maxEclipseDurationSeconds != null ? orbit.maxEclipseDurationSeconds : (orbitalPeriodSec * 0.37);
  const daylightDurationSec = orbitalPeriodSec - eclipseDurationSec;

  const eclipseDurationHours = eclipseDurationSec / 3600;
  const daylightDurationHours = daylightDurationSec / 3600;

  // Energy consumed during eclipse (Wh)
  const energyConsumedEclipseWh = eclipseLoadW * eclipseDurationHours;

  // Battery capacity
  const totalBatteryCapacityWh = Number(battery?.capacityWh) || 0;
  const usableBatteryCapacityWh = totalBatteryCapacityWh * MAX_RECOMMENDED_DOD;

  // Depth of Discharge (DoD) during eclipse
  const dodReached = totalBatteryCapacityWh > 0 ? (energyConsumedEclipseWh / totalBatteryCapacityWh) : 1.0;
  const dodPercent = dodReached * 100;

  // Daylight net energy generated (Wh) after powering daytime load
  const netDaylightPowerMarginW = daylightGenerationW - daylightLoadW;
  const energyGeneratedDaylightWh = daylightGenerationW * daylightDurationHours;
  const energySurplusDaylightWh = netDaylightPowerMarginW * daylightDurationHours;

  // Battery replenishment check: can solar recharge the battery within daylight period?
  const canRechargeBattery = energySurplusDaylightWh >= energyConsumedEclipseWh;
  const rechargeRatio = energyConsumedEclipseWh > 0 ? (energySurplusDaylightWh / energyConsumedEclipseWh) : 1.0;

  // Power margins
  const daylightPowerMarginW = daylightGenerationW - daylightLoadW;
  const daylightPowerMarginPercent = daylightLoadW > 0 ? (daylightPowerMarginW / daylightLoadW) * 100 : 0;

  // Status diagnosis
  let status = 'optimal';
  const issues = [];

  if (daylightPowerMarginW < 0) {
    status = 'critical';
    issues.push(`Solar array generation (${daylightGenerationW.toFixed(0)} W) is insufficient for daytime loads (${daylightLoadW.toFixed(0)} W). Spacecraft will brown out even in sunlight.`);
  }

  if (dodReached > 1.0) {
    status = 'critical';
    issues.push(`Battery depleted during eclipse! Required: ${energyConsumedEclipseWh.toFixed(0)} Wh, Installed: ${totalBatteryCapacityWh.toFixed(0)} Wh. Depth of Discharge: ${dodPercent.toFixed(0)}%.`);
  } else if (dodReached > MAX_RECOMMENDED_DOD) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Battery Depth of Discharge (${dodPercent.toFixed(1)}%) exceeds recommended threshold (${(MAX_RECOMMENDED_DOD * 100).toFixed(0)}%). High risk of accelerated cell degradation.`);
  }

  if (!canRechargeBattery && energyConsumedEclipseWh > 0) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Daylight solar surplus (${energySurplusDaylightWh.toFixed(0)} Wh) cannot fully recharge eclipse energy draw (${energyConsumedEclipseWh.toFixed(0)} Wh). Net orbital energy deficit.`);
  }

  return {
    daylightGenerationW,
    eclipseGenerationW,
    solarDistanceAU,
    busBasePowerW,
    instrumentsPowerW,
    daylightLoadW,
    peakLoadW,
    eclipseLoadW,
    daylightPowerMarginW,
    daylightPowerMarginPercent,
    orbitalPeriodSec,
    daylightDurationHours,
    eclipseDurationHours,
    energyConsumedEclipseWh,
    totalBatteryCapacityWh,
    usableBatteryCapacityWh,
    dodReached,
    dodPercent,
    energySurplusDaylightWh,
    canRechargeBattery,
    rechargeRatio,
    status,
    issues,
    breakdown: [
      { name: 'Onboard Computing', watts: computingPowerW },
      { name: 'ADCS / Pointing', watts: adcsPowerW },
      { name: 'Thermal Heaters', watts: thermalPowerW },
      { name: 'Communications (Tx)', watts: commsTransmitPowerW },
      { name: 'Scientific Payload', watts: instrumentsPowerW },
    ],
  };
}
