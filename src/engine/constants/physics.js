/**
 * Standard Physical Constants and Celestial Body Parameters
 * Verified from CODATA, IAU, and NASA Planetary Fact Sheets.
 * All units are SI internally.
 */

export const CONSTANTS = {
  // Gravitational Constant G (m^3 kg^-1 s^-2)
  G: 6.67430e-11,

  // Standard acceleration of gravity on Earth surface (m/s^2)
  g0: 9.80665,

  // Speed of light in vacuum (m/s)
  c: 299792458,

  // Solar irradiance at 1.0 AU (W/m^2)
  SOLAR_FLUX_1AU: 1361.0,

  // Astronomical Unit (m)
  AU: 149597870700,

  // Stefan-Boltzmann constant (W m^-2 K^-4)
  SIGMA: 5.670374e-8,
};

export const CELESTIAL_BODIES = {
  earth: {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    color: '#3b82f6',
    accentColor: '#38bdf8',
    textureKey: 'earth',
    // Radius in meters
    radius: 6371000,
    radiusKm: 6371,
    // Standard Gravitational Parameter mu = G * M (m^3/s^2)
    mu: 3.986004418e14,
    // Mass in kg
    mass: 5.9722e24,
    // Sidereal rotation period in seconds (23h 56m 4s)
    rotationPeriod: 86164.1,
    // Distance from Sun in AU
    solarDistanceAU: 1.0,
    // Solar flux at body (W/m^2)
    solarFlux: 1361.0,
    hasAtmosphere: true,
    atmosphereScaleHeight: 8500, // meters
    groundStations: [
      { id: 'gs-fairbanks', name: 'Fairbanks Facility (Alaska)', lat: 64.8, lon: -147.7, minElevationDeg: 5 },
      { id: 'gs-svalbard', name: 'SvalSat (Norway)', lat: 78.2, lon: 15.4, minElevationDeg: 5 },
      { id: 'gs-wallops', name: 'Wallops Flight Facility', lat: 37.9, lon: -75.5, minElevationDeg: 5 },
      { id: 'gs-madrid', name: 'Madrid DSN (Spain)', lat: 40.4, lon: -4.2, minElevationDeg: 6 },
      { id: 'gs-goldstone', name: 'Goldstone DSN (California)', lat: 35.4, lon: -116.9, minElevationDeg: 6 },
      { id: 'gs-canberra', name: 'Canberra DSN (Australia)', lat: -35.4, lon: 148.9, minElevationDeg: 6 },
    ],
  },

  moon: {
    id: 'moon',
    name: 'Moon',
    type: 'moon',
    parentBody: 'earth',
    color: '#94a3b8',
    accentColor: '#cbd5e1',
    textureKey: 'moon',
    radius: 1737400,
    radiusKm: 1737.4,
    mu: 4.9048695e12,
    mass: 7.342e22,
    rotationPeriod: 2360584.8, // Synchronous with orbit around Earth (~27.3 days)
    solarDistanceAU: 1.0,
    solarFlux: 1361.0,
    hasAtmosphere: false,
    groundStations: [
      { id: 'dsn-earth-link', name: 'Earth DSN Array Link', lat: 0, lon: 0, minElevationDeg: 0, isRelay: true },
    ],
  },

  mars: {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    color: '#ef4444',
    accentColor: '#f97316',
    textureKey: 'mars',
    radius: 3389500,
    radiusKm: 3389.5,
    mu: 4.282837e13,
    mass: 6.4171e23,
    rotationPeriod: 88642.7, // 1 sol = 24h 37m 22s
    solarDistanceAU: 1.524,
    // Solar flux drops with inverse-square law: 1361 / (1.524^2) = 586 W/m^2
    solarFlux: 586.0,
    hasAtmosphere: true,
    atmosphereScaleHeight: 11100,
    groundStations: [
      { id: 'mars-relay-orbit', name: 'Mars Reconnaissance Relay / DSN', lat: 0, lon: 0, minElevationDeg: 0, isRelay: true },
    ],
  },

  asteroid: {
    id: 'asteroid',
    name: '16 Psyche / Near-Earth Asteroid',
    type: 'asteroid',
    color: '#a8a29e',
    accentColor: '#d6d3d1',
    textureKey: 'asteroid',
    radius: 110000,
    radiusKm: 110,
    mu: 1.60e9,
    mass: 2.4e19,
    rotationPeriod: 15120, // ~4.2 hours
    solarDistanceAU: 2.92,
    solarFlux: 159.6, // 1361 / (2.92^2)
    hasAtmosphere: false,
    groundStations: [
      { id: 'dsn-deep-space', name: 'Deep Space Network 70m Antennas', lat: 0, lon: 0, minElevationDeg: 0, isRelay: true },
    ],
  },
};
