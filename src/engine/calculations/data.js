/**
 * Onboard Data Management Engine
 * Calculates instrument data generation rates, daily data volume, compression ratios,
 * and verifies solid-state storage margins against orbit contact gaps.
 */

/**
 * Calculates data generation and storage dynamics.
 * 
 * @param {object} params
 * @param {Array}  params.instruments - Active payload instruments
 * @param {object} params.computing - Onboard computer and solid-state recorder (SSR)
 * @param {number} params.dutyCycleFraction - Fraction of orbit instruments actively record (e.g. 0.3 to 0.7)
 * @param {number} params.maxContactGapHours - Maximum time between ground station downlinks (hours)
 * @returns {object} Data budget metrics
 */
export function calculateDataBudget({
  instruments = [],
  computing = null,
  dutyCycleFraction = 0.5,
  maxContactGapHours = 12,
}) {
  // Aggregate uncompressed generation rate from active instruments (Mbps)
  const rawRateMbps = (instruments || []).reduce(
    (acc, inst) => acc + (Number(inst.dataRateMbps) || 0),
    0
  );

  // Onboard data compression factor (e.g. 2:1 lossless compression = 0.5)
  const compressionRatio = Number(computing?.compressionFactor) || 0.6; // 40% reduction standard
  const effectiveRateMbps = rawRateMbps * compressionRatio;
  const effectiveRateMBps = (effectiveRateMbps * 1e6) / (8 * 1024 * 1024); // MegaBytes per second

  // Data generated during one active hour of observation (MB)
  const hourlyDataMB = effectiveRateMBps * 3600;

  // Daily generated volume (MB) based on planned duty cycle
  const activeHoursPerDay = 24 * Math.max(0.1, Math.min(1.0, dutyCycleFraction));
  const dailyDataVolumeMB = hourlyDataMB * activeHoursPerDay;
  const dailyDataVolumeGB = dailyDataVolumeMB / 1024;

  // Total installed onboard storage capacity (GB converted to MB)
  const storageCapacityGB = Number(computing?.storageCapacityGB) || 16;
  const storageCapacityMB = storageCapacityGB * 1024;

  // Worst-case data accumulated during maximum downlink contact gap (MB)
  const accumulatedDataInGapMB = hourlyDataMB * (maxContactGapHours * dutyCycleFraction);
  const gapStorageUtilizationPercent = storageCapacityMB > 0 
    ? (accumulatedDataInGapMB / storageCapacityMB) * 100 
    : 100;

  let status = 'optimal';
  const issues = [];

  if (accumulatedDataInGapMB > storageCapacityMB) {
    status = 'critical';
    issues.push(`Buffer Overflow Risk: Data generated between downlink passes (${(accumulatedDataInGapMB / 1024).toFixed(1)} GB) exceeds onboard storage (${storageCapacityGB} GB). Instruments will drop frames.`);
  } else if (gapStorageUtilizationPercent > 80) {
    status = 'warning';
    issues.push(`High Storage Utilization: Up to ${gapStorageUtilizationPercent.toFixed(0)}% of onboard memory will be occupied between ground station passes.`);
  }

  return {
    rawRateMbps,
    effectiveRateMbps,
    effectiveRateMBps,
    dailyDataVolumeMB,
    dailyDataVolumeGB,
    storageCapacityGB,
    storageCapacityMB,
    maxContactGapHours,
    accumulatedDataInGapMB,
    accumulatedDataInGapGB: accumulatedDataInGapMB / 1024,
    gapStorageUtilizationPercent,
    status,
    issues,
  };
}
