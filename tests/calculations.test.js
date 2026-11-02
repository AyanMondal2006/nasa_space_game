import { describe, it, expect } from 'vitest';
import { calculateCircularOrbit, calculateHohmannTransfer } from '../src/engine/calculations/orbitalMechanics.js';
import { calculateMassBudget, checkLaunchVehicleCapacity } from '../src/engine/calculations/mass.js';
import { calculatePowerBudget } from '../src/engine/calculations/power.js';
import { calculateBudget } from '../src/engine/calculations/budget.js';
import { calculateDataBudget } from '../src/engine/calculations/data.js';
import { calculateCommunicationsBudget } from '../src/engine/calculations/communications.js';
import { SeededRandom } from '../src/utils/seededRandom.js';

describe('Orbital Mechanics Calculations', () => {
  it('correctly calculates Earth 400 km circular LEO parameters', () => {
    const orbit = calculateCircularOrbit('earth', 400, 51.6);
    // Standard physics: radius ~ 6771 km
    expect(orbit.radiusKm).toBeCloseTo(6771, 0);
    // Velocity v = sqrt(mu / r) ~ 7.67 km/s (7670 m/s)
    expect(orbit.velocityKms).toBeGreaterThan(7.6);
    expect(orbit.velocityKms).toBeLessThan(7.75);
    // Period T ~ 92.5 minutes
    expect(orbit.periodMinutes).toBeGreaterThan(91.5);
    expect(orbit.periodMinutes).toBeLessThan(93.5);
    // Eclipse duration ~ 35 - 38 minutes in standard in-plane LEO
    expect(orbit.maxEclipseDurationSeconds / 60).toBeGreaterThan(34);
    expect(orbit.maxEclipseDurationSeconds / 60).toBeLessThan(39);
  });

  it('correctly calculates Hohmann transfer Delta-V from LEO (400km) to GEO (35786km)', () => {
    const hohmann = calculateHohmannTransfer('earth', 400, 35786);
    // Total delta-v from 400km to GEO is well known in aerospace to be ~3.93 km/s
    expect(hohmann.totalDeltaVKms).toBeGreaterThan(3.85);
    expect(hohmann.totalDeltaVKms).toBeLessThan(4.05);
    // Transfer duration is ~5.26 hours
    expect(hohmann.transferTimeHours).toBeGreaterThan(5.0);
    expect(hohmann.transferTimeHours).toBeLessThan(5.5);
  });
});

describe('Mass Budget Engine', () => {
  it('correctly computes dry mass, 20% margin, and Tsiolkovsky propellant mass', () => {
    const spacecraft = {
      bus: { massKg: 100 },
      power: { massKg: 30 },
      battery: { massKg: 20 },
      instruments: [{ massKg: 40 }, { massKg: 10 }],
      comms: { massKg: 15 },
      adcs: { massKg: 25 },
      computing: { massKg: 10 },
      thermal: { massKg: 10 },
      propulsion: { massKg: 40, ispSeconds: 300 }, // Bi-propellant thruster (300s Isp)
      requiredDeltaVMs: 500, // 500 m/s maneuver requirement
      massMarginFraction: 0.20,
    };

    const mass = calculateMassBudget(spacecraft);
    // Dry mass = 100 + 50 + 50 + 15 + 25 + 10 + 10 + 40 = 300 kg
    expect(mass.dryMass).toBe(300);
    // 20% margin = 60 kg => dry with margin = 360 kg
    expect(mass.massMargin).toBe(60);
    expect(mass.dryMassWithMargin).toBe(360);
    // Propellant: m_prop = 360 * (exp(500 / (300 * 9.80665)) - 1) ~ 66.4 kg
    expect(mass.propellantMass).toBeGreaterThan(64);
    expect(mass.propellantMass).toBeLessThan(69);
    // Total launch mass wet = 360 + 66.4 = ~426.4 kg
    expect(mass.totalLaunchMass).toBeGreaterThan(424);
    expect(mass.totalLaunchMass).toBeLessThan(430);
  });

  it('validates launch vehicle payload capacity accurately', () => {
    const launchVehicle = { name: 'Small Rocket', payloadCapacityKg: 500 };
    const validResult = checkLaunchVehicleCapacity(launchVehicle, 420);
    expect(validResult.isValid).toBe(true);
    expect(validResult.marginKg).toBe(80);

    const invalidResult = checkLaunchVehicleCapacity(launchVehicle, 650);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.marginKg).toBe(-150);
  });
});

describe('Power & Energy Balance Engine', () => {
  it('correctly computes solar attenuation at Mars and battery depth of discharge', () => {
    const orbit = { periodSeconds: 5400, maxEclipseDurationSeconds: 1980 }; // 33 min eclipse
    const power = calculatePowerBudget({
      powerSource: { generationW: 1000, isRTG: false },
      battery: { capacityWh: 500 },
      instruments: [{ powerConsumptionW: 80 }],
      comms: { powerConsumptionW: 50 },
      adcs: { powerConsumptionW: 30 },
      computing: { powerConsumptionW: 20 },
      thermal: { powerConsumptionW: 20 },
      orbit,
      bodyId: 'mars', // Mars is at 1.524 AU => power scaled by 1/(1.524^2) ~ 0.43
    });

    // Generation at Mars should be ~430 W from 1000 W Earth-rated panels
    expect(power.daylightGenerationW).toBeGreaterThan(420);
    expect(power.daylightGenerationW).toBeLessThan(440);

    // Eclipse duration = 1980s = 0.55 hours
    // Base power + 70% instrument standby = (20 + 30 + 20 + 15) + (80 * 0.7) = 85 + 56 = 141 W
    // Energy draw = 141 * 0.55 ~ 77.5 Wh
    // DoD for 500 Wh battery = 77.5 / 500 ~ 15.5%
    expect(power.dodPercent).toBeGreaterThan(12);
    expect(power.dodPercent).toBeLessThan(20);
    expect(power.status).toBe('optimal');
  });

  it('detects battery failure when capacity is insufficient for eclipse', () => {
    const orbit = { periodSeconds: 5400, maxEclipseDurationSeconds: 2000 };
    const power = calculatePowerBudget({
      powerSource: { generationW: 500 },
      battery: { capacityWh: 30 }, // Tiny battery!
      instruments: [{ powerConsumptionW: 200 }],
      computing: { powerConsumptionW: 50 },
      orbit,
      bodyId: 'earth',
    });

    expect(power.dodReached).toBeGreaterThan(1.0);
    expect(power.status).toBe('critical');
  });
});

describe('Budget Engine', () => {
  it('calculates lifecycle cost and contingency reserve accurately', () => {
    const budget = calculateBudget({
      spacecraft: {
        bus: { costUSD: 10_000_000 },
        power: { costUSD: 2_000_000 },
        instruments: [{ costUSD: 8_000_000 }],
      },
      launchVehicle: { launchCostUSD: 50_000_000 },
      missionDurationDays: 365,
      budgetLimit: 100_000_000,
      contingencyFraction: 0.15,
    });

    // Total hardware: 20M
    expect(budget.totalHardwareCost).toBe(20_000_000);
    // Launch: 50M
    expect(budget.launchCost).toBe(50_000_000);
    // Direct cost ~ 20M + 50M + ~3.4M operations = ~73.4M
    expect(budget.directCost).toBeGreaterThan(70_000_000);
    // Total with 15% contingency ~ 84.4M
    expect(budget.totalCost).toBeGreaterThan(80_000_000);
    expect(budget.totalCost).toBeLessThan(90_000_000);
    expect(budget.remainingBudget).toBeGreaterThan(10_000_000);
    expect(budget.status).toBe('optimal');
  });
});

describe('Communications and Data Engine', () => {
  it('detects buffer overflow and communication bottlenecks', () => {
    const data = calculateDataBudget({
      instruments: [{ dataRateMbps: 20 }], // High rate instrument
      computing: { compressionFactor: 0.5, storageCapacityGB: 4 }, // Only 4 GB storage
      dutyCycleFraction: 0.8,
      maxContactGapHours: 12,
    });

    // 10 Mbps effective => ~1.19 MB/s => 4290 MB/hr => in 9.6 active hours ~ 41 GB!
    // Exceeds 4 GB storage!
    expect(data.status).toBe('critical');
    expect(data.issues.length).toBeGreaterThan(0);
  });
});

describe('Deterministic Seeded PRNG', () => {
  it('reproduces identical pseudorandom sequences for same seed', () => {
    const rng1 = new SeededRandom(98765);
    const rng2 = new SeededRandom(98765);

    const seq1 = [rng1.next(), rng1.range(10, 50), rng1.intRange(1, 100)];
    const seq2 = [rng2.next(), rng2.range(10, 50), rng2.intRange(1, 100)];

    expect(seq1).toEqual(seq2);
  });
});
