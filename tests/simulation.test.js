import { describe, it, expect } from 'vitest';
import { SimulationEngine, SIMULATION_PHASES } from '../src/engine/simulation/simulationEngine.js';
import { MISSION_CAMPAIGNS } from '../src/data/missions.js';
import { calculateMissionScore } from '../src/engine/simulation/missionScoring.js';

describe('Simulation Engine', () => {
  it('initializes and steps deterministically through phases', () => {
    const campaign = MISSION_CAMPAIGNS[0];
    const mission = {
      ...campaign,
      spacecraft: {
        bus: { massKg: 120, costUSD: 4_500_000 },
        power: { generationW: 1100, massKg: 45, costUSD: 3_200_000, isRTG: false },
        battery: { capacityWh: 1500, massKg: 32, costUSD: 1_400_000 },
        instruments: [{ id: 'inst-optical-hr', massKg: 42, powerConsumptionW: 95, dataRateMbps: 25, costUSD: 12_000_000, scienceValue: 40 }],
        comms: { bandwidthMbps: 45, powerConsumptionW: 65, massKg: 16, costUSD: 2_800_000 },
        adcs: { powerConsumptionW: 42, massKg: 24, costUSD: 4_200_000 },
        computing: { powerConsumptionW: 28, massKg: 14, storageCapacityGB: 128, compressionFactor: 0.5, costUSD: 5_200_000 },
        thermal: { powerConsumptionW: 24, massKg: 26, costUSD: 1_800_000 },
      },
      launchVehicle: { name: 'Falcon 9', payloadCapacityKg: 17500, launchCostUSD: 67_000_000 },
      orbit: { altitudeKm: 705, inclinationDeg: 98.2 },
      destination: 'earth',
    };

    const sim1 = new SimulationEngine(mission, 42);
    const sim2 = new SimulationEngine(mission, 42);

    expect(sim1.state.status).toBe(SIMULATION_PHASES.PRE_LAUNCH);

    sim1.start();
    sim2.start();
    expect(sim1.state.status).toBe(SIMULATION_PHASES.LAUNCH);

    // Step 20 times (20 * 60 = 1200 seconds)
    for (let i = 0; i < 20; i++) {
      sim1.step(60);
      sim2.step(60);
    }

    // Both should reach ORBIT_INSERTION
    expect(sim1.state.status).toBe(SIMULATION_PHASES.ORBIT_INSERTION);
    expect(sim2.state.status).toBe(SIMULATION_PHASES.ORBIT_INSERTION);

    // States must match identically (deterministic)
    expect(sim1.state.missionTimeSeconds).toBe(sim2.state.missionTimeSeconds);
    expect(sim1.state.batteryEnergyWh).toBeCloseTo(sim2.state.batteryEnergyWh, 4);
    expect(sim1.state.orbitAngleRad).toBeCloseTo(sim2.state.orbitAngleRad, 4);
    expect(sim1.state.events.length).toBe(sim2.state.events.length);
  });

  it('evaluates transparent mission score and letter grades accurately', () => {
    const campaign = MISSION_CAMPAIGNS[0];
    const dummyState = {
      status: SIMULATION_PHASES.COMPLETED,
      totalDataCollectedMB: 300_000,
      totalDataDownlinkedMB: 280_000,
      subsystemHealth: { bus: 100, power: 98, battery: 95, instruments: 100 },
      objectivesProgress: {
        'obj-earth-data-volume': 100,
        'obj-earth-downlink-return': 95,
        'obj-earth-power-health': 100,
        'obj-earth-budget-efficiency': 100,
      },
    };

    const validation = {
      budget: { totalCost: 140_000_000 },
      power: { daylightPowerMarginPercent: 35 },
      mass: { massMarginFraction: 0.20 },
    };

    const score = calculateMissionScore({
      mission: campaign,
      simulationState: dummyState,
      validationMetrics: validation,
    });

    expect(score.finalScore).toBeGreaterThan(80);
    expect(['A+', 'A', 'B']).toContain(score.grade);
    expect(score.isSuccess).toBe(true);
    expect(score.achievements.length).toBeGreaterThan(0);
  });
});
