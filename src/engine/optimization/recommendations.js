/**
 * Design Recommendation & Optimization Engine
 * Evaluates current mission design against engineering constraints and returns
 * actionable, transparent suggestions that the user can inspect and apply with 1 click.
 */

import { LAUNCH_VEHICLES } from '../../data/launchVehicles.js';
import { BATTERY_CATALOG, POWER_CATALOG, COMPUTING_CATALOG, COMMS_CATALOG } from '../../data/spacecraftComponents.js';

export function generateRecommendations(mission, validationResults) {
  if (!mission || !validationResults) return [];

  const recommendations = [];
  const { metrics, errors, warnings } = validationResults;
  const { spacecraft, launchVehicle, destination = 'earth' } = mission;

  // 1. Launch Vehicle Capacity Recommendation
  const massError = errors.find(e => e.title.includes('Capacity Exceeded') || e.title.includes('Mass'));
  if (massError && launchVehicle) {
    const launchMass = metrics?.mass?.totalLaunchMass || 0;
    // Find next available vehicle capable of lifting this mass to destination
    const viableVehicles = LAUNCH_VEHICLES.filter(lv => {
      const cap = lv.maxPayloadMassByDestination?.[destination] != null 
        ? lv.maxPayloadMassByDestination[destination] 
        : lv.payloadCapacityKg;
      return cap >= launchMass && lv.id !== launchVehicle.id;
    }).sort((a, b) => a.launchCostUSD - b.launchCostUSD);

    if (viableVehicles.length > 0) {
      const bestAlternative = viableVehicles[0];
      recommendations.push({
        id: 'rec-upgrade-launcher',
        category: 'Launch Vehicle',
        title: `Upgrade to ${bestAlternative.name}`,
        reason: `Your wet launch mass (${launchMass.toFixed(0)} kg) exceeds ${launchVehicle.name}'s lift capacity.`,
        actionType: 'SET_LAUNCH_VEHICLE',
        targetValue: bestAlternative,
        impactDescription: `Increases payload capacity to ${bestAlternative.payloadCapacityKg.toLocaleString()} kg (+${((bestAlternative.payloadCapacityKg - launchMass)).toFixed(0)} kg margin). Cost difference: +$${((bestAlternative.launchCostUSD - launchVehicle.launchCostUSD) / 1e6).toFixed(1)}M.`,
      });
    }
  }

  // 2. Battery Capacity Recommendation
  const batteryIssue = [...errors, ...warnings].find(e => e.title.includes('Battery') || e.title.includes('DoD'));
  if (batteryIssue && spacecraft?.battery) {
    const currentCapacity = spacecraft.battery.capacityWh;
    const largerBatteries = BATTERY_CATALOG.filter(b => b.capacityWh > currentCapacity)
      .sort((a, b) => a.capacityWh - b.capacityWh);

    if (largerBatteries.length > 0) {
      const recommendedBattery = largerBatteries[0];
      recommendations.push({
        id: 'rec-upgrade-battery',
        category: 'Power & Storage',
        title: `Upgrade to ${recommendedBattery.name}`,
        reason: 'Current battery depth-of-discharge during eclipse is too severe or leads to total blackout.',
        actionType: 'SET_BATTERY',
        targetValue: recommendedBattery,
        impactDescription: `Increases storage from ${currentCapacity} Wh to ${recommendedBattery.capacityWh} Wh, lowering eclipse DoD into safe flight margins. Mass change: +${recommendedBattery.massKg - spacecraft.battery.massKg} kg.`,
      });
    }
  }

  // 3. Solar Power Generation Recommendation
  const powerIssue = errors.find(e => e.title.includes('Daylight Power') || e.title.includes('Brownout'));
  if (powerIssue && spacecraft?.power) {
    const currentGen = spacecraft.power.generationW;
    const largerArrays = POWER_CATALOG.filter(p => p.generationW > currentGen)
      .sort((a, b) => a.generationW - b.generationW);

    if (largerArrays.length > 0) {
      const recPower = largerArrays[0];
      recommendations.push({
        id: 'rec-upgrade-power',
        category: 'Electrical Power',
        title: `Install ${recPower.name}`,
        reason: 'Continuous subsystem consumption exceeds current daytime solar array output.',
        actionType: 'SET_POWER',
        targetValue: recPower,
        impactDescription: `Boosts generation to ${recPower.generationW} W (+${recPower.generationW - currentGen} W), restoring a positive daylight power balance.`,
      });
    }
  }

  // 4. Solid-State Storage Overflow Recommendation
  const storageIssue = errors.find(e => e.title.includes('Memory Overflow') || e.title.includes('Buffer'));
  if (storageIssue && spacecraft?.computing) {
    const currentStorageGB = spacecraft.computing.storageCapacityGB || 16;
    const largerComputers = COMPUTING_CATALOG.filter(c => (c.storageCapacityGB || 0) > currentStorageGB)
      .sort((a, b) => a.storageCapacityGB - b.storageCapacityGB);

    if (largerComputers.length > 0) {
      const recComp = largerComputers[0];
      recommendations.push({
        id: 'rec-upgrade-computing',
        category: 'Computing & Memory',
        title: `Upgrade to ${recComp.name}`,
        reason: 'Instruments generate data faster than the current buffer can hold between ground station passes.',
        actionType: 'SET_COMPUTING',
        targetValue: recComp,
        impactDescription: `Expands onboard SSR storage to ${recComp.storageCapacityGB} GB, preventing un-downlinked image frames from being overwritten.`,
      });
    }
  }

  // 5. Downlink Backlog Recommendation
  const commsIssue = warnings.find(e => e.title.includes('Downlink Bottleneck') || e.title.includes('Backlog'));
  if (commsIssue && spacecraft?.comms) {
    const currentRate = spacecraft.comms.bandwidthMbps || 1;
    const betterComms = COMMS_CATALOG.filter(c => (c.bandwidthMbps || 0) > currentRate)
      .sort((a, b) => a.bandwidthMbps - b.bandwidthMbps);

    if (betterComms.length > 0) {
      const recComms = betterComms[0];
      recommendations.push({
        id: 'rec-upgrade-comms',
        category: 'Communications',
        title: `Upgrade to ${recComms.name}`,
        reason: 'Science data is accumulating into a persistent telemetry backlog.',
        actionType: 'SET_COMMS',
        targetValue: recComms,
        impactDescription: `Increases base bandwidth from ${currentRate} Mbps to ${recComms.bandwidthMbps} Mbps, clearing daily data backlogs during scheduled contacts.`,
      });
    }
  }

  return recommendations;
}
