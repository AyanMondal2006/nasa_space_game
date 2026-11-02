/**
 * Launch Vehicle Catalog
 * Calibrated against verified manufacturer flight manuals (SpaceX, Rocket Lab, ULA, ESA, NASA).
 * Note: Costs represent commercial launch service estimates.
 */

export const LAUNCH_VEHICLES = [
  {
    id: 'lv-electron',
    name: 'Electron (Rocket Lab)',
    manufacturer: 'Rocket Lab',
    country: 'USA / New Zealand',
    payloadCapacityKg: 300, // 300 kg to 500 km LEO
    maxPayloadMassByDestination: {
      earth: 300,
      moon: 35, // With Curie Kick Stage
      mars: 0,
      asteroid: 0,
    },
    fairingDiameterM: 1.2,
    fairingHeightM: 2.5,
    launchCostUSD: 7_500_000,
    reliabilityAssumption: '94%',
    supportedDestinations: ['earth', 'moon'],
    description: 'Dedicated carbon-composite small-satellite launcher featuring 3D-printed Rutherford electric-turbopump engines.',
  },
  {
    id: 'lv-falcon-9',
    name: 'Falcon 9 Block 5 (SpaceX)',
    manufacturer: 'SpaceX',
    country: 'USA',
    payloadCapacityKg: 17_500, // Reusable LEO capacity
    maxPayloadMassByDestination: {
      earth: 17500,
      moon: 4500,
      mars: 3200,
      asteroid: 1800,
    },
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    launchCostUSD: 67_000_000,
    reliabilityAssumption: '99%',
    supportedDestinations: ['earth', 'moon', 'mars', 'asteroid'],
    description: 'Flight-proven reusable two-stage rocket powered by nine Merlin 1D engines. High flight cadence and reliability.',
  },
  {
    id: 'lv-atlas-v-551',
    name: 'Atlas V 551 (ULA)',
    manufacturer: 'United Launch Alliance',
    country: 'USA',
    payloadCapacityKg: 18_800,
    maxPayloadMassByDestination: {
      earth: 18800,
      moon: 6800,
      mars: 3850,
      asteroid: 2400,
    },
    fairingDiameterM: 5.4,
    fairingHeightM: 14.5,
    launchCostUSD: 145_000_000,
    reliabilityAssumption: '100%',
    supportedDestinations: ['earth', 'moon', 'mars', 'asteroid'],
    description: 'Heavy exploration workhorse with five solid rocket boosters and Centaur upper stage. Flown missions to Pluto (New Horizons) and Mars (Curiosity, Perseverance).',
  },
  {
    id: 'lv-ariane-64',
    name: 'Ariane 64 (ESA / Arianespace)',
    manufacturer: 'ArianeGroup / ESA',
    country: 'European Union',
    payloadCapacityKg: 21_600,
    maxPayloadMassByDestination: {
      earth: 21600,
      moon: 8500,
      mars: 4200,
      asteroid: 2800,
    },
    fairingDiameterM: 5.4,
    fairingHeightM: 14.0,
    launchCostUSD: 115_000_000,
    reliabilityAssumption: '97%',
    supportedDestinations: ['earth', 'moon', 'mars', 'asteroid'],
    description: 'European heavy-lift rocket equipped with four P120C solid rocket boosters and restartable Vinci upper stage engine.',
  },
  {
    id: 'lv-falcon-heavy',
    name: 'Falcon Heavy (SpaceX)',
    manufacturer: 'SpaceX',
    country: 'USA',
    payloadCapacityKg: 63_800,
    maxPayloadMassByDestination: {
      earth: 63800,
      moon: 19000,
      mars: 16800,
      asteroid: 9500,
    },
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    launchCostUSD: 97_000_000,
    reliabilityAssumption: '98%',
    supportedDestinations: ['earth', 'moon', 'mars', 'asteroid'],
    description: 'Triple-core heavy lifter generating 5.1 million pounds of thrust. Optimal for massive interplanetary science probes.',
  },
];
