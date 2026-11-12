
import { describe, it, expect } from 'vitest';

import { assembleMissionFromConfig } from '../src/state/MissionContext.jsx';

import { MISSION_CAMPAIGNS } from '../src/data/missions.js';

import { PROPULSION_CATALOG } from '../src/data/spacecraftComponents.js';

describe('Campaign Propellant Configuration', () => {
  it('should assign 422 kg of propellant to the Lunar campaign', () => {
    const campaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-lunar-prospector'
    );

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration
    );

    expect(mission.spacecraft.propulsion.initialPropellantKg).toBe(422);
    expect(mission.deltaVRequiredMs).toBe(1250);
  });

  it('should assign 1867 kg of propellant to the Mars campaign', () => {
    const campaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-mars-surveyor'
    );

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration
    );

    expect(mission.spacecraft.propulsion.initialPropellantKg).toBe(1867);
    expect(mission.deltaVRequiredMs).toBe(2200);
  });

  it('should preserve the catalog default for the Earth campaign', () => {
    const campaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-earth-observation'
    );

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration
    );

    const catalogPropulsion = PROPULSION_CATALOG.find(
      (item) => item.id === campaign.defaultConfiguration.propulsionId
    );

    expect(
      mission.spacecraft.propulsion.initialPropellantKg
    ).toBe(catalogPropulsion.initialPropellantKg);
  });

  it('should not mutate the shared propulsion catalog', () => {
    const catalogSnapshot = JSON.parse(
      JSON.stringify(PROPULSION_CATALOG)
    );

    const lunarCampaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-lunar-prospector'
    );

    const marsCampaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-mars-surveyor'
    );

    assembleMissionFromConfig(
      lunarCampaign,
      lunarCampaign.defaultConfiguration
    );

    assembleMissionFromConfig(
      marsCampaign,
      marsCampaign.defaultConfiguration
    );

    expect(PROPULSION_CATALOG).toEqual(catalogSnapshot);
  });

  it('should reject a negative propellant override and preserve the catalog default', () => {
    const campaign = MISSION_CAMPAIGNS.find(
      (item) => item.id === 'campaign-lunar-prospector'
    );

    const catalogPropulsion = PROPULSION_CATALOG.find(
      (item) => item.id === campaign.defaultConfiguration.propulsionId
    );

    const invalidConfiguration = {
      ...campaign.defaultConfiguration,
      propellantLoadKg: -100,
    };

    const mission = assembleMissionFromConfig(
      campaign,
      invalidConfiguration
    );

    expect(
      mission.spacecraft.propulsion.initialPropellantKg
    ).toBe(catalogPropulsion.initialPropellantKg);
  });
});
