/**
 * Professional formatting utilities for aerospace telemetry, resources, and reports.
 */

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0';
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

export function formatMass(kg) {
  if (kg == null || isNaN(kg)) return '0.0 kg';
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t (${Math.round(kg).toLocaleString()} kg)`;
  }
  return `${Number(kg).toFixed(1)} kg`;
}

export function formatPower(watts) {
  if (watts == null || isNaN(watts)) return '0 W';
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${Math.round(watts)} W`;
}

export function formatEnergy(wattHours) {
  if (wattHours == null || isNaN(wattHours)) return '0 Wh';
  if (wattHours >= 1000) {
    return `${(wattHours / 1000).toFixed(2)} kWh`;
  }
  return `${Math.round(wattHours)} Wh`;
}

export function formatDataSize(megabytes) {
  if (megabytes == null || isNaN(megabytes)) return '0 MB';
  if (megabytes >= 1024 * 1024) {
    return `${(megabytes / (1024 * 1024)).toFixed(2)} TB`;
  }
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  return `${Number(megabytes).toFixed(1)} MB`;
}

export function formatBitrate(kbps) {
  if (kbps == null || isNaN(kbps)) return '0 kbps';
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(2)} Mbps`;
  }
  return `${Math.round(kbps)} kbps`;
}

export function formatVelocity(ms) {
  if (ms == null || isNaN(ms)) return '0 km/s';
  const kms = ms / 1000;
  return `${kms.toFixed(2)} km/s`;
}

export function formatDistance(km) {
  if (km == null || isNaN(km)) return '0 km';
  if (km >= 1_000_000) {
    return `${(km / 1_000_000).toFixed(2)}M km`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

export function formatPercent(fraction) {
  if (fraction == null || isNaN(fraction)) return '0%';
  return `${(fraction * 100).toFixed(1)}%`;
}

/**
 * Formats seconds into Mission Elapsed Time (MET)
 * Format: "MET +DDDd HH:MM:SS"
 */
export function formatMET(totalSeconds) {
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) {
    return 'MET +00d 00:00:00';
  }
  const s = Math.floor(totalSeconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const dStr = String(days).padStart(2, '0');
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `MET +${dStr}d ${hStr}:${mStr}:${sStr}`;
}

export function formatDurationCompact(seconds) {
  if (!seconds || isNaN(seconds)) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${Math.floor(seconds % 60)}s`;
}
