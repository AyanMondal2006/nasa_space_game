/**
 * Orbital Mechanics Engine
 * Implements deterministic two-body gravitational mechanics, circular and Keplerian calculations,
 * eclipse geometry, ground track motion, and delta-v estimations.
 */

import { CELESTIAL_BODIES } from '../constants/physics.js';
import { kmToM, mToKm, degToRad, radToDeg } from '../../utils/units.js';

/**
 * Calculates fundamental circular orbit parameters for a given celestial body and altitude.
 * 
 * @param {string} bodyId - 'earth' | 'moon' | 'mars' | 'asteroid'
 * @param {number} altitudeKm - Altitude above mean surface in kilometers
 * @param {number} inclinationDeg - Inclination relative to equator in degrees (default 0)
 * @returns {object} Orbital parameters
 */
export function calculateCircularOrbit(bodyId = 'earth', altitudeKm = 400, inclinationDeg = 0) {
  const body = CELESTIAL_BODIES[bodyId] || CELESTIAL_BODIES.earth;
  const altitudeM = kmToM(altitudeKm);
  const radiusM = body.radius + altitudeM;
  const radiusKm = mToKm(radiusM);

  if (altitudeM <= 0) {
    throw new Error(`Altitude must be positive and above the surface of ${body.name}`);
  }

  // Circular orbital velocity v = sqrt(mu / r) in m/s
  const velocityMs = Math.sqrt(body.mu / radiusM);
  const velocityKms = velocityMs / 1000;

  // Orbital period T = 2 * pi * sqrt(r^3 / mu) in seconds
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(radiusM, 3) / body.mu);
  const periodMinutes = periodSeconds / 60;
  const periodHours = periodMinutes / 60;

  // Mean motion n = 2 * pi / T (rad/s)
  const meanMotionRadPerSec = (2 * Math.PI) / periodSeconds;
  const orbitsPerDay = (86400 / periodSeconds);

  // Escape velocity at this altitude v_esc = sqrt(2 * mu / r)
  const escapeVelocityMs = Math.sqrt(2 * body.mu / radiusM);

  // Eclipse calculations (geometric shadow of central body)
  // Half-angle of body viewed from satellite: sin(theta) = R_body / r
  const angularRadius = Math.asin(Math.min(1.0, body.radius / radiusM));
  
  // Standard worst-case eclipse fraction (when orbital plane aligns with Sun line)
  const maxEclipseFraction = (2 * angularRadius) / (2 * Math.PI);
  const maxEclipseDurationSeconds = maxEclipseFraction * periodSeconds;
  const maxSunlightDurationSeconds = periodSeconds - maxEclipseDurationSeconds;

  // Ground track velocity over surface (approximate equatorial relative velocity)
  const bodyEquatorialSpeedMs = (2 * Math.PI * body.radius) / body.rotationPeriod;
  const subSatelliteSpeedMs = velocityMs * (body.radius / radiusM);

  return {
    bodyId: body.id,
    bodyName: body.name,
    altitudeKm,
    radiusKm,
    radiusM,
    velocityMs,
    velocityKms,
    periodSeconds,
    periodMinutes,
    periodHours,
    meanMotionRadPerSec,
    orbitsPerDay,
    escapeVelocityMs,
    escapeVelocityKms: escapeVelocityMs / 1000,
    angularRadiusDeg: radToDeg(angularRadius),
    maxEclipseFraction,
    maxEclipseDurationSeconds,
    maxSunlightDurationSeconds,
    inclinationDeg,
    subSatelliteSpeedMs,
    bodyEquatorialSpeedMs,
  };
}

/**
 * Calculates Hohmann Transfer Delta-V between two co-planar circular orbits around the same body.
 */
export function calculateHohmannTransfer(bodyId = 'earth', r1Km = 400, r2Km = 35786) {
  const body = CELESTIAL_BODIES[bodyId] || CELESTIAL_BODIES.earth;
  const r1 = body.radius + kmToM(r1Km);
  const r2 = body.radius + kmToM(r2Km);

  const v1 = Math.sqrt(body.mu / r1);
  const v2 = Math.sqrt(body.mu / r2);

  // Semimajor axis of transfer ellipse
  const a_tx = (r1 + r2) / 2;

  // Velocity at periapsis and apoapsis of transfer orbit
  const v_tx_peri = Math.sqrt(body.mu * (2 / r1 - 1 / a_tx));
  const v_tx_apo = Math.sqrt(body.mu * (2 / r2 - 1 / a_tx));

  const deltaV1 = Math.abs(v_tx_peri - v1);
  const deltaV2 = Math.abs(v2 - v_tx_apo);
  const totalDeltaV = deltaV1 + deltaV2;

  // Transfer time is half the transfer orbit period
  const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(a_tx, 3) / body.mu);

  return {
    deltaV1,
    deltaV2,
    totalDeltaV,
    totalDeltaVKms: totalDeltaV / 1000,
    transferTimeSeconds,
    transferTimeHours: transferTimeSeconds / 3600,
    transferTimeDays: transferTimeSeconds / 86400,
  };
}

/**
 * Computes instantaneous satellite position in orbit given true anomaly theta (radians).
 * Returns Cartesian [x, y, z] in central body inertial frame (m) and whether satellite is in shadow.
 */
export function getOrbitPositionAndEclipse(radiusM, inclinationRad, thetaRad, bodyRadiusM, sunVector = [1, 0, 0]) {
  // Orbital plane coordinates
  const xOrb = radiusM * Math.cos(thetaRad);
  const yOrb = radiusM * Math.sin(thetaRad);

  // Rotate by inclination around X-axis
  const x = xOrb;
  const y = yOrb * Math.cos(inclinationRad);
  const z = yOrb * Math.sin(inclinationRad);

  // Position vector
  const pos = [x, y, z];

  // Eclipse check with cylindrical/conical shadow model
  // Dot product with sun vector
  const dotSun = (x * sunVector[0] + y * sunVector[1] + z * sunVector[2]) / radiusM;

  // Behind the central body plane
  let isInEclipse = false;
  if (dotSun < 0) {
    // Distance from Sun-Body centerline
    const perpDistSq = (x * x + y * y + z * z) - Math.pow(x * sunVector[0] + y * sunVector[1] + z * sunVector[2], 2);
    if (perpDistSq < bodyRadiusM * bodyRadiusM) {
      isInEclipse = true;
    }
  }

  return {
    position: pos,
    isInEclipse,
    dotSun,
  };
}

/**
 * Estimates sub-satellite latitude and longitude for ground track visualization.
 */
export function getSubSatelliteCoordinates(thetaRad, inclinationRad, timeSeconds, rotationPeriod) {
  // Sub-satellite latitude: sin(lat) = sin(i) * sin(theta)
  const sinLat = Math.sin(inclinationRad) * Math.sin(thetaRad);
  const latRad = Math.asin(Math.max(-1, Math.min(1, sinLat)));
  const latDeg = radToDeg(latRad);

  // Sub-satellite longitude relative to nodal crossing
  const lonNodeRad = Math.atan2(Math.cos(inclinationRad) * Math.sin(thetaRad), Math.cos(thetaRad));
  
  // Earth's rotation offset
  const bodyRotationAngle = ((timeSeconds % rotationPeriod) / rotationPeriod) * (2 * Math.PI);
  let lonRad = lonNodeRad - bodyRotationAngle;

  // Wrap to [-PI, PI]
  lonRad = ((lonRad + Math.PI) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
  const lonDeg = radToDeg(lonRad);

  return {
    latitude: latDeg,
    longitude: lonDeg,
  };
}
