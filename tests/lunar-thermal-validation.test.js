
import { describe, expect, it } from 'vitest';

import { validateMission } from '../src/engine/validation/validateMission.js';
import { MISSION_CAMPAIGNS } from '../src/data/missions.js';

import {
  BUS_CATALOG,
  POWER_CATALOG,
  BATTERY_CATALOG,
  INSTRUMENT_CATALOG,
  COMMS_CATALOG,
  ADCS_CATALOG,
  COMPUTING_CATALOG,
  THERMAL_CATALOG,
  PROPULSION_CATALOG,
} from '../src/data/spacecraftComponents.js';

function findById(catalog, id) {
  return catalog.find((component) => component.id === id);
}

function createLunarMission(thermalOverrides = {}) {
  const campaign = MISSION_CAMPAIGNS.find(
    (item) => item.id === 'campaign-lunar-prospector'
  );

  if (!campaign) {
    throw new Error('Lunar campaign was not found.');
  }

  const config = campaign.defaultConfiguration;

  const propulsion = findById(
    PROPULSION_CATALOG,
    config.propulsionId
  );

  return {
    ...campaign,

    spacecraft: {
      bus: findById(BUS_CATALOG, config.busId),
      power: findById(POWER_CATALOG, config.powerId),
      battery: findById(BATTERY_CATALOG, config.batteryId),

      instruments: config.instrumentsIds.map((id) =>
        findById(INSTRUMENT_CATALOG, id)
      ),

      comms: findById(COMMS_CATALOG, config.commsId),
      adcs: findById(ADCS_CATALOG, config.adcsId),
      computing: findById(COMPUTING_CATALOG, config.computingId),

      thermal: {
        ...findById(THERMAL_CATALOG, config.thermalId),
        ...thermalOverrides,
      },

      propulsion: {
        ...propulsion,
        initialPropellantKg: 422,
      },
    },

    launchVehicle: {
      name: 'Falcon 9 Block 5',
      payloadCapacityKg: 4500,
      launchCostUSD: 67_000_000,
    },

    orbit: {
      altitudeKm: 100,
      inclinationDeg: 90,
    },

    deltaVRequiredMs: 1250,
  };
}

describe('Lunar Mission Thermal Validation', () => {

  it('evaluates the configured lunar cold-case thermal model', () => {
    const result = validateMission(createLunarMission());

    expect(result.metrics.thermal.isEvaluable).toBe(true);

    expect(
      result.metrics.thermal.isEngineeringCertified
    ).toBe(false);

    expect(
      result.metrics.thermal.assumptionStatus
    ).toBe('GAME_DESIGN_ASSUMPTION');

    expect(
      Number.isFinite(result.metrics.thermal.thermalMarginW)
    ).toBe(true);
  });

  it('checks the 50 W lunar thermal objective', () => {
    const result = validateMission(createLunarMission());

    const thermalObjectiveCheck =
      result.metrics.readiness.checks.find(
        (check) => check.id === 'thermal_margin_model'
      );

    expect(thermalObjectiveCheck).toBeDefined();

    expect(thermalObjectiveCheck.passed).toBe(
      result.metrics.thermal.thermalMarginW >= 50
    );
  });

  it('does not claim thermal feasibility when cold-case parameters are missing', () => {
    const result = validateMission(
      createLunarMission({
        coldCaseScreeningModel: null,
      })
    );

    expect(result.metrics.thermal.isEvaluable).toBe(false);

    expect(result.metrics.thermal.thermalMarginW).toBeNull();

    const thermalObjectiveCheck =
      result.metrics.readiness.checks.find(
        (check) => check.id === 'thermal_margin_model'
      );

    expect(thermalObjectiveCheck.passed).toBe(false);

    expect(thermalObjectiveCheck.status).toBe('not_evaluated');
  });

});
