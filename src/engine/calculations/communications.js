/**
 * Space Communications & Downlink Engine
 * Models RF link rates, ground station contact opportunities (LEO passes and DSN deep space tracking),
 * daily downlink throughput, and telemetry backlog accumulation.
 */

import { CELESTIAL_BODIES } from '../constants/physics.js';

/**
 * Calculates communications performance, contact availability, and downlink margin.
 * 
 * @param {object} params
 * @param {object} params.comms - Communication subsystem component
 * @param {string} params.bodyId - Target celestial body ('earth' | 'moon' | 'mars' | 'asteroid')
 * @param {number} params.altitudeKm - Orbit altitude
 * @param {number} params.dailyDataGeneratedMB - Daily data collected by instruments (MB)
 * @returns {object} Communications metrics and link health
 */
export function calculateCommunicationsBudget({
  comms,
  bodyId = 'earth',
  altitudeKm = 400,
  dailyDataGeneratedMB = 1000,
}) {
  const body = CELESTIAL_BODIES[bodyId] || CELESTIAL_BODIES.earth;

  // Baseline transmit speed based on antenna frequency band & architecture
  const baseBandwidthMbps = Number(comms?.bandwidthMbps) || 1.0;
  
  // Distance attenuation factor
  // LEO (~400 - 1000 km): full rated bandwidth
  // GEO (35,786 km): ~0.6x
  // Moon (384,400 km): ~0.25x
  // Mars (1.5 AU ~ 225M km): ~0.02x RF (or higher for optical laser comms)
  let distanceFactor = 1.0;
  let typicalContactMinutesPerDay = 120; // 2 hours default
  let propagationDelaySeconds = 0.003; // ~3ms for LEO

  if (bodyId === 'earth') {
    if (altitudeKm > 20000) {
      distanceFactor = 0.6; // GEO
      typicalContactMinutesPerDay = 1440; // Continuous line-of-sight for GEO
      propagationDelaySeconds = 0.12;
    } else {
      distanceFactor = 1.0; // LEO
      // Polar Sun-Sync orbit passes Svalbard/Fairbanks ~10 times/day for ~10 min each
      typicalContactMinutesPerDay = 110;
      propagationDelaySeconds = 0.003;
    }
  } else if (bodyId === 'moon') {
    distanceFactor = comms?.isOptical ? 0.6 : 0.25;
    typicalContactMinutesPerDay = 360; // 6 hours DSN pass window
    propagationDelaySeconds = 1.3; // 1.3 light-seconds
  } else if (bodyId === 'mars') {
    distanceFactor = comms?.isOptical ? 0.15 : 0.025;
    typicalContactMinutesPerDay = 240; // 4 hours DSN tracking schedule
    propagationDelaySeconds = 780; // ~13 minutes light delay
  } else if (bodyId === 'asteroid') {
    distanceFactor = comms?.isOptical ? 0.08 : 0.015;
    typicalContactMinutesPerDay = 180; // 3 hours DSN pass
    propagationDelaySeconds = 1400; // ~23 minutes light delay
  }

  // Effective downlink rate at destination
  const effectiveDownlinkRateMbps = Math.max(0.01, baseBandwidthMbps * distanceFactor);
  const effectiveDownlinkRateMBps = (effectiveDownlinkRateMbps * 1e6) / (8 * 1024 * 1024);

  // Total daily downlink capacity (MB)
  const contactSecondsPerDay = typicalContactMinutesPerDay * 60;
  const dailyDownlinkCapacityMB = effectiveDownlinkRateMBps * contactSecondsPerDay;
  const dailyDownlinkCapacityGB = dailyDownlinkCapacityMB / 1024;

  // Net daily balance: Generated - Downlinked
  const netDailyBacklogMB = dailyDataGeneratedMB - dailyDownlinkCapacityMB;
  const downlinkMarginPercent = dailyDataGeneratedMB > 0 
    ? ((dailyDownlinkCapacityMB - dailyDataGeneratedMB) / dailyDataGeneratedMB) * 100 
    : 100;

  let status = 'optimal';
  const issues = [];

  if (netDailyBacklogMB > 0) {
    status = 'critical';
    issues.push(`Communication Bottleneck: Instruments collect ${(dailyDataGeneratedMB / 1024).toFixed(1)} GB/day, but downlink capacity is only ${dailyDownlinkCapacityGB.toFixed(1)} GB/day. Science backlog will grow by ${(netDailyBacklogMB / 1024).toFixed(1)} GB each day.`);
  } else if (downlinkMarginPercent < 20) {
    status = 'warning';
    issues.push(`Tight Downlink Margin: Downlink excess capacity is only ${downlinkMarginPercent.toFixed(0)}%. Any missed ground station pass will cause data to accumulate.`);
  }

  return {
    baseBandwidthMbps,
    effectiveDownlinkRateMbps,
    effectiveDownlinkRateMBps,
    typicalContactMinutesPerDay,
    propagationDelaySeconds,
    propagationDelayText: propagationDelaySeconds > 60 
      ? `${(propagationDelaySeconds / 60).toFixed(1)} min` 
      : `${propagationDelaySeconds.toFixed(3)} s`,
    dailyDownlinkCapacityMB,
    dailyDownlinkCapacityGB,
    netDailyBacklogMB,
    downlinkMarginPercent,
    status,
    issues,
  };
}
