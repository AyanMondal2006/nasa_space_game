import { describe, expect, it } from 'vitest';

import { assembleMissionFromConfig } from '../src/state/MissionContext.jsx';

import { MISSION_CAMPAIGNS } from '../src/data/missions.js';

import {
  GAMEPLAY_DIFFICULTY,
  DIFFICULTY_PROFILE_VERSION,
} from '../src/data/difficultyProfiles.js';

function getCampaign(id) {
  const campaign = MISSION_CAMPAIGNS.find(
    (item) => item.id === id
  );

  if (!campaign) {
    throw new Error(`Campaign not found: ${id}`);
  }

  return campaign;
}

describe('Gameplay difficulty mission integration', () => {
  it('uses Standard when no gameplay difficulty is supplied', () => {
    const campaign = getCampaign('campaign-earth-observation');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration
    );

    expect(mission.gameplayDifficulty).toBe(
      GAMEPLAY_DIFFICULTY.STANDARD
    );

    expect(mission.difficultyProfileVersion).toBe(
      DIFFICULTY_PROFILE_VERSION
    );

    expect(mission.objectives[0].targetValueGB).toBe(250);
  });

  it('stores campaign difficulty separately from gameplay difficulty', () => {
    const campaign = getCampaign('campaign-lunar-prospector');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.BEGINNER
    );

    expect(mission.campaignDifficulty).toBe('Intermediate');
    expect(mission.gameplayDifficulty).toBe('beginner');
  });

  it('applies Beginner objectives to an assembled mission', () => {
    const campaign = getCampaign('campaign-lunar-prospector');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.BEGINNER
    );

    const dataObjective = mission.objectives.find(
      (item) => item.type === 'data_volume'
    );

    const downlinkObjective = mission.objectives.find(
      (item) => item.type === 'downlink_efficiency'
    );

    expect(dataObjective.targetValueGB).toBe(120);
    expect(downlinkObjective.targetValuePercent).toBe(70);
  });

  it('applies Advanced objectives to an assembled mission', () => {
    const campaign = getCampaign('campaign-lunar-prospector');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    const dataObjective = mission.objectives.find(
      (item) => item.type === 'data_volume'
    );

    const downlinkObjective = mission.objectives.find(
      (item) => item.type === 'downlink_efficiency'
    );

    expect(dataObjective.targetValueGB).toBe(180);
    expect(downlinkObjective.targetValuePercent).toBe(85);
  });

  it('preserves Lunar propellant, mission delta-V and insertion objective', () => {
    const campaign = getCampaign('campaign-lunar-prospector');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    const insertionObjective = mission.objectives.find(
      (item) => item.type === 'orbital_insertion'
    );

    expect(mission.spacecraft.propulsion.initialPropellantKg).toBe(422);
    expect(mission.deltaVRequiredMs).toBe(1250);
    expect(insertionObjective.targetValueDeltaVMs).toBe(1100);
  });

  it('preserves Mars propellant and mission delta-V in Advanced mode', () => {
    const campaign = getCampaign('campaign-mars-surveyor');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    expect(mission.spacecraft.propulsion.initialPropellantKg).toBe(1867);
    expect(mission.deltaVRequiredMs).toBe(2200);
  });

  it('does not mutate the original campaign objectives', () => {
    const campaign = getCampaign('campaign-earth-observation');

    const originalObjectives = JSON.parse(
      JSON.stringify(campaign.objectives)
    );

    assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      GAMEPLAY_DIFFICULTY.ADVANCED
    );

    expect(campaign.objectives).toEqual(originalObjectives);
  });

  it('falls back to Standard for an unsupported gameplay mode', () => {
    const campaign = getCampaign('campaign-earth-observation');

    const mission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      'unsupported-mode'
    );

    expect(mission.gameplayDifficulty).toBe(
      GAMEPLAY_DIFFICULTY.STANDARD
    );

    expect(mission.objectives[0].targetValueGB).toBe(250);
  });
});