/**
 * ASTRAJECT Random Anomaly System
 *
 * Defines temporary spacecraft anomalies, their operational effects,
 * event probabilities, and automatic recovery parameters.
 *
 * These are gameplay simulation parameters, not empirical spacecraft
 * failure-rate predictions.
 */

export const BASE_ANOMALY_RATE_PER_HOUR = 0.65;

export const ANOMALY_DIFFICULTY_MULTIPLIERS = Object.freeze({
  beginner: 0.5,
  standard: 1,
  advanced: 1.5,
});

export const RANDOM_ANOMALY_CATALOG = [
  {
    id: 'adcs-pointing-disturbance',
    subsystem: 'adcs',
    title: 'ADCS Pointing Disturbance',
    durationSeconds: 1800,
    healthImpact: 2,
    requires: 'adcs',
    effects: {
      dataCollectionMultiplier: 0.75,
    },
    message:
      'Star-tracker disturbance detected. Pointing accuracy has temporarily degraded, reducing science observation efficiency.',
    recoveryMessage:
      'Star-tracker reacquisition completed. Attitude control and science observation efficiency restored.',
  },
  {
    id: 'solar-radio-interference',
    subsystem: 'comms',
    title: 'Solar Radio Interference',
    durationSeconds: 1200,
    healthImpact: 1,
    requires: 'comms',
    effects: {
      downlinkMultiplier: 0.5,
    },
    message:
      'Solar radio interference detected. Communications throughput is temporarily reduced during ground-station contact.',
    recoveryMessage:
      'Radio interference has subsided. Communications throughput restored to nominal capability.',
  },
  {
    id: 'solar-array-string-fault',
    subsystem: 'power',
    title: 'Solar Array String Fault',
    durationSeconds: 2400,
    healthImpact: 3,
    requires: 'solar-array',
    effects: {
      powerGenerationMultiplier: 0.8,
    },
    message:
      'Solar-array string fault detected. Available solar power generation has temporarily decreased by 20%.',
    recoveryMessage:
      'Solar-array protection and current balancing sequence completed. Power generation restored.',
  },
  {
    id: 'battery-controller-fault',
    subsystem: 'battery',
    title: 'Battery Controller Fault',
    durationSeconds: 1800,
    healthImpact: 1,
    requires: 'battery',
    effects: {
      additionalPowerLoadW: 20,
    },
    message:
      'Battery charge-controller fault detected. Protective balancing circuitry is consuming an additional 20 W.',
    recoveryMessage:
      'Battery controller reset and cell-balancing sequence completed. Additional power load removed.',
  },
  {
    id: 'thermal-control-excursion',
    subsystem: 'thermal',
    title: 'Thermal Control Excursion',
    durationSeconds: 1800,
    healthImpact: 1,
    requires: 'thermal',
    effects: {
      additionalPowerLoadW: 15,
      dataCollectionMultiplier: 0.9,
    },
    message:
      'Thermal-control excursion detected. Additional heater demand and instrument protection are temporarily reducing available science operations.',
    recoveryMessage:
      'Thermal control stabilized. Heater demand returned to nominal and instrument operations restored.',
  },
];

/**
 * Returns the probability of an anomaly during one simulation step.
 *
 * Probability is time-scaled using simulated seconds, so simulation
 * speed does not alter the event rate per simulated hour.
 */
export function getAnomalyProbability(
  deltaSeconds,
  difficulty = 'standard'
) {
  if (
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds <= 0
  ) {
    return 0;
  }

  const difficultyMultiplier =
    ANOMALY_DIFFICULTY_MULTIPLIERS[difficulty] ??
    ANOMALY_DIFFICULTY_MULTIPLIERS.standard;

  const hourlyRate =
    BASE_ANOMALY_RATE_PER_HOUR * difficultyMultiplier;

  return Math.min(
    1,
    Math.max(
      0,
      1 - Math.pow(1 - hourlyRate, deltaSeconds / 3600)
    )
  );
}

/**
 * Filters anomaly events according to installed spacecraft hardware.
 */
export function getAvailableRandomAnomalies(mission) {
  const spacecraft = mission?.spacecraft || {};

  return RANDOM_ANOMALY_CATALOG.filter((anomaly) => {
    switch (anomaly.requires) {
      case 'solar-array':
        return (
          Boolean(spacecraft.power) &&
          spacecraft.power.isRTG !== true
        );

      case 'battery':
        return Number(spacecraft.battery?.capacityWh) > 0;

      case 'adcs':
        return Boolean(spacecraft.adcs);

      case 'comms':
        return Boolean(spacecraft.comms);

      case 'thermal':
        return Boolean(spacecraft.thermal);

      default:
        return false;
    }
  });
}

/**
 * Combines operational effects from all currently active anomalies.
 * Multipliers combine multiplicatively; additional loads add together.
 */
export function calculateOperationalEffects(activeAnomalies = []) {
  const combined = {
    powerGenerationMultiplier: 1,
    dataCollectionMultiplier: 1,
    downlinkMultiplier: 1,
    additionalPowerLoadW: 0,
  };

  if (!Array.isArray(activeAnomalies)) {
    return combined;
  }

  activeAnomalies.forEach((anomaly) => {
    const effects =
      anomaly?.effects && typeof anomaly.effects === 'object'
        ? anomaly.effects
        : {};

    if (
      Number.isFinite(effects.powerGenerationMultiplier) &&
      effects.powerGenerationMultiplier >= 0
    ) {
      combined.powerGenerationMultiplier *=
        effects.powerGenerationMultiplier;
    }

    if (
      Number.isFinite(effects.dataCollectionMultiplier) &&
      effects.dataCollectionMultiplier >= 0
    ) {
      combined.dataCollectionMultiplier *=
        effects.dataCollectionMultiplier;
    }

    if (
      Number.isFinite(effects.downlinkMultiplier) &&
      effects.downlinkMultiplier >= 0
    ) {
      combined.downlinkMultiplier *=
        effects.downlinkMultiplier;
    }

    if (
      Number.isFinite(effects.additionalPowerLoadW) &&
      effects.additionalPowerLoadW > 0
    ) {
      combined.additionalPowerLoadW +=
        effects.additionalPowerLoadW;
    }
  });

  combined.powerGenerationMultiplier = Math.min(
    1,
    Math.max(0.4, combined.powerGenerationMultiplier)
  );

  combined.dataCollectionMultiplier = Math.min(
    1,
    Math.max(0.3, combined.dataCollectionMultiplier)
  );

  combined.downlinkMultiplier = Math.min(
    1,
    Math.max(0.3, combined.downlinkMultiplier)
  );

  combined.additionalPowerLoadW = Math.min(
    100,
    Math.max(0, combined.additionalPowerLoadW)
  );

  return combined;
}

/**
 * Calculates time-weighted operational effects over one simulation tick.
 * Supports anomalies starting or expiring partway through the interval.
 */
export function calculateOperationalEffectsForInterval(
  activeAnomalies = [],
  intervalStartSeconds,
  deltaSeconds
) {
  const nominal = {
    powerGenerationMultiplier: 1,
    dataCollectionMultiplier: 1,
    downlinkMultiplier: 1,
    additionalPowerLoadW: 0,
  };

  if (
    !Number.isFinite(intervalStartSeconds) ||
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds <= 0 ||
    !Array.isArray(activeAnomalies) ||
    activeAnomalies.length === 0
  ) {
    return nominal;
  }

  const intervalEndSeconds = intervalStartSeconds + deltaSeconds;

  if (!Number.isFinite(intervalEndSeconds)) {
    return nominal;
  }

  const getStart = (anomaly) =>
    Number.isFinite(anomaly?.startedAtSeconds)
      ? anomaly.startedAtSeconds
      : intervalStartSeconds;

  const getEnd = (anomaly) =>
    Number.isFinite(anomaly?.expiresAtSeconds)
      ? anomaly.expiresAtSeconds
      : intervalEndSeconds;

  const boundaries = new Set([
    intervalStartSeconds,
    intervalEndSeconds,
  ]);

  activeAnomalies.forEach((anomaly) => {
    const start = getStart(anomaly);
    const end = getEnd(anomaly);

    if (start > intervalStartSeconds && start < intervalEndSeconds) {
      boundaries.add(start);
    }

    if (end > intervalStartSeconds && end < intervalEndSeconds) {
      boundaries.add(end);
    }
  });

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  const result = {
    powerGenerationMultiplier: 0,
    dataCollectionMultiplier: 0,
    downlinkMultiplier: 0,
    additionalPowerLoadW: 0,
  };

  for (let index = 0; index < sortedBoundaries.length - 1; index++) {
    const segmentStart = sortedBoundaries[index];
    const segmentEnd = sortedBoundaries[index + 1];
    const segmentDuration = segmentEnd - segmentStart;

    if (segmentDuration <= 0) continue;

    const segmentAnomalies = activeAnomalies.filter((anomaly) =>
      getStart(anomaly) < segmentEnd &&
      getEnd(anomaly) > segmentStart
    );

    const effects = calculateOperationalEffects(segmentAnomalies);
    const weight = segmentDuration / deltaSeconds;

    result.powerGenerationMultiplier +=
      effects.powerGenerationMultiplier * weight;

    result.dataCollectionMultiplier +=
      effects.dataCollectionMultiplier * weight;

    result.downlinkMultiplier +=
      effects.downlinkMultiplier * weight;

    result.additionalPowerLoadW +=
      effects.additionalPowerLoadW * weight;
  }

  return result;
}
