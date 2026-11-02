/**
 * Pre-configured Orbital Regimes Catalog
 * Models realistic orbital profiles with physical inclinations, altitudes, and mission trade-offs.
 */

export const ORBIT_CATALOG = [
  // --- EARTH ORBITS ---
  {
    id: 'orbit-earth-sso',
    name: 'Sun-Synchronous Orbit (SSO)',
    centralBody: 'earth',
    altitudeKm: 705,
    inclinationDeg: 98.2, // Retrograde inclination causes nodal precession matching Earth's orbit around the Sun
    eccentricity: 0.001,
    orbitType: 'Polar / Sun-Synchronous',
    recommendedMissionTypes: ['earth_observation', 'climate_science', 'cartography'],
    description: 'Nodal precession matches Earth’s annual revolution around the Sun (approx. 0.9856 deg/day), ensuring consistent local solar time for every equator crossing.',
    advantages: [
      'Consistent solar illumination geometry across consecutive imaging passes.',
      'Global ground coverage with repeated ground tracks every few days.',
      'Predictable solar array illumination angles for power generation.',
    ],
    tradeoffs: [
      'Requires higher launch energy (retrograde launch against Earth rotation).',
      'Passes through Earth polar radiation horn zones.',
    ],
  },
  {
    id: 'orbit-earth-leo',
    name: 'Standard Low Earth Orbit (LEO)',
    centralBody: 'earth',
    altitudeKm: 400,
    inclinationDeg: 51.6, // ISS standard
    eccentricity: 0.0,
    orbitType: 'Circular LEO',
    recommendedMissionTypes: ['technology_demonstration', 'microgravity', 'rapid_survey'],
    description: 'Low-altitude orbit maximizing payload mass to orbit. Spacecraft completes an orbit every ~92.5 minutes with frequent daytime and eclipse transitions.',
    advantages: [
      'Maximum launch vehicle payload capacity (lowest orbital energy).',
      'Low latency communications and minimal path loss.',
      'High ground image resolution at lower camera focal lengths.',
    ],
    tradeoffs: [
      'Frequent eclipses (up to 37 minutes of shadow per 92-minute orbit).',
      'Residual atmospheric drag requires periodic orbit reboost maneuvers.',
      'Short ground station pass durations (typically 8–10 minutes).',
    ],
  },
  {
    id: 'orbit-earth-geo',
    name: 'Geostationary Orbit (GEO)',
    centralBody: 'earth',
    altitudeKm: 35786,
    inclinationDeg: 0.0,
    eccentricity: 0.0,
    orbitType: 'Equatorial Circular Synchronous',
    recommendedMissionTypes: ['telecom_relay', 'weather_monitoring', 'early_warning'],
    description: 'Orbital period equals Earth sidereal rotation period (23h 56m 4s). The spacecraft remains fixed over a single equatorial sub-satellite point.',
    advantages: [
      'Continuous 24/7 visibility to an entire planetary hemisphere.',
      'Zero antenna tracking required for fixed ground stations.',
      'Minimal eclipse durations (only around spring/fall equinoxes).',
    ],
    tradeoffs: [
      'Substantial launch delta-V required (~3.9 km/s from LEO).',
      'Higher communication round-trip latency (~240 ms).',
      'High ambient radiation inside Van Allen outer belts.',
    ],
  },

  // --- MOON ORBITS ---
  {
    id: 'orbit-moon-polar-100',
    name: 'Low Lunar Polar Science Orbit',
    centralBody: 'moon',
    altitudeKm: 100,
    inclinationDeg: 90.0,
    eccentricity: 0.0,
    orbitType: 'Lunar Polar Circular',
    recommendedMissionTypes: ['lunar_science', 'polar_ice_mapping', 'landing_site_recon'],
    description: 'Circular orbit at 100 km altitude over lunar poles. The Moon rotates beneath the orbit every 27.3 days, allowing 100% surface scanning.',
    advantages: [
      'Complete global mapping including permanently shadowed craters at the lunar south pole.',
      'Close range yields high gravity field and thermal infrared sensitivity.',
      'Direct line-of-sight to Earth for ~14 days per lunar month from high polar vantage.',
    ],
    tradeoffs: [
      'Lunar gravitational lumps (mass concentrations or mascons) cause orbital perturbations.',
      'Frequent lunar farside communications occultation from Earth.',
    ],
  },

  // --- MARS ORBITS ---
  {
    id: 'orbit-mars-mro-320',
    name: 'Low Mars Science Orbit (Sun-Synchronous)',
    centralBody: 'mars',
    altitudeKm: 320,
    inclinationDeg: 92.8,
    eccentricity: 0.005,
    orbitType: 'Mars Polar Sun-Sync',
    recommendedMissionTypes: ['mars_science', 'atmosphere_survey', 'surface_geology'],
    description: '320 km circular orbit designed for daily global coverage of Mars. Spacecraft crosses the equator at approximately 3:00 PM local solar time.',
    advantages: [
      'Optimized thermal contrast and shadow relief for mineral and dust storm imaging.',
      'Acts as a prime data relay satellite for Mars surface landers and rovers.',
    ],
    tradeoffs: [
      'Solar irradiance is only ~43% of Earth levels, demanding oversized solar wings.',
      'Long light propagation delays (4 to 21 minutes) prevent real-time ground control.',
    ],
  },

  // --- ASTEROID ORBITS ---
  {
    id: 'orbit-asteroid-prospector',
    name: 'Close Asteroid Proximity Orbit',
    centralBody: 'asteroid',
    altitudeKm: 25,
    inclinationDeg: 85.0,
    eccentricity: 0.02,
    orbitType: 'Micro-Gravity Bound Trajectory',
    recommendedMissionTypes: ['asteroid_prospector', 'resource_survey'],
    description: 'Low-speed bound orbit in weak irregular gravitational field. Requires autonomous optical navigation and station-keeping.',
    advantages: [
      'High-resolution composition imaging of exposed metallic and carbonaceous ore bodies.',
      'Ultra-low orbital velocities allow long integration observation times.',
    ],
    tradeoffs: [
      'Complex non-spherical gravity field creates orbital instability.',
      'Extremely low solar flux at 2.9 AU requires heavy RTG or massive arrays.',
    ],
  },
];
