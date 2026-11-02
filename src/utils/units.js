/**
 * Explicit unit conversions and dimensional utilities for aerospace simulations.
 * Internal calculations strictly use SI units:
 * - Distance: meters (m)
 * - Mass: kilograms (kg)
 * - Time: seconds (s)
 * - Velocity: meters/second (m/s)
 * - Power: Watts (W)
 * - Energy: Joules (J) or Watt-hours (Wh) where standard
 * - Angle: radians (rad)
 * - Frequency: Hertz (Hz)
 * - Data volume: bytes (B) or bits (b)
 */

export const UNITS = {
  // Distance
  KM_TO_M: 1000,
  M_TO_KM: 0.001,
  AU_TO_KM: 149597870.7,
  AU_TO_M: 149597870700,

  // Angles
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,

  // Time
  HOUR_TO_SEC: 3600,
  DAY_TO_SEC: 86400,
  YEAR_TO_SEC: 31557600, // 365.25 days
  SEC_TO_HOUR: 1 / 3600,
  SEC_TO_DAY: 1 / 86400,

  // Energy & Power
  W_TO_KW: 0.001,
  KW_TO_W: 1000,
  WH_TO_JOULES: 3600,
  JOULES_TO_WH: 1 / 3600,
  KWH_TO_WH: 1000,

  // Data
  BYTES_TO_KB: 1 / 1024,
  BYTES_TO_MB: 1 / (1024 * 1024),
  BYTES_TO_GB: 1 / (1024 * 1024 * 1024),
  BITS_TO_BYTES: 1 / 8,
  BYTES_TO_BITS: 8,
  MBPS_TO_BPS: 1000000,
  KBPS_TO_BPS: 1000,
};

export function kmToM(km) {
  return Number(km) * UNITS.KM_TO_M;
}

export function mToKm(m) {
  return Number(m) * UNITS.M_TO_KM;
}

export function degToRad(deg) {
  return Number(deg) * UNITS.DEG_TO_RAD;
}

export function radToDeg(rad) {
  return Number(rad) * UNITS.RAD_TO_DEG;
}

export function secondsToDays(sec) {
  return Number(sec) / UNITS.DAY_TO_SEC;
}

export function daysToSeconds(days) {
  return Number(days) * UNITS.DAY_TO_SEC;
}

export function whToJoules(wh) {
  return Number(wh) * UNITS.WH_TO_JOULES;
}

export function joulesToWh(j) {
  return Number(j) * UNITS.JOULES_TO_WH;
}
