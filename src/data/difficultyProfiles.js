
/**
 * ASTRAJECT Gameplay Difficulty Profiles
 *
 * Difficulty changes supported mission objective thresholds only.
 * Physical mission parameters such as delta-V, propellant, spacecraft
 * specifications, mission budget ceilings, and orbital mechanics are
 * intentionally not modified.
 */

export const GAMEPLAY_DIFFICULTY = Object.freeze({
  BEGINNER: 'beginner',
  STANDARD: 'standard',
  ADVANCED: 'advanced',
});

export const DIFFICULTY_PROFILE_VERSION = 1;

export const GAMEPLAY_DIFFICULTY_OPTIONS = [
  {
    value: GAMEPLAY_DIFFICULTY.BEGINNER,
    label: 'Beginner',
    description:
      'Forgiving objectives with more room to learn mission design.',
  },
  {
    value: GAMEPLAY_DIFFICULTY.STANDARD,
    label: 'Standard',
    description:
      'The original campaign objective targets and scoring rules.',
  },
  {
    value: GAMEPLAY_DIFFICULTY.ADVANCED,
    label: 'Advanced',
    description:
      'More demanding science, power, communication and resource targets.',
  },
];

const DIFFICULTY_PROFILES = {
  [GAMEPLAY_DIFFICULTY.BEGINNER]: {
    dataVolumeMultiplier: 0.8,
    downlinkOffset: -10,
    batteryDoDOffset: 0.1,
    budgetReserveOffset: -5,
    powerMarginOffset: -5,
    thermalMarginOffset: -10,
    readinessOffset: -10,
  },

  [GAMEPLAY_DIFFICULTY.STANDARD]: {
    dataVolumeMultiplier: 1,
    downlinkOffset: 0,
    batteryDoDOffset: 0,
    budgetReserveOffset: 0,
    powerMarginOffset: 0,
    thermalMarginOffset: 0,
    readinessOffset: 0,
  },

  [GAMEPLAY_DIFFICULTY.ADVANCED]: {
    dataVolumeMultiplier: 1.2,
    downlinkOffset: 5,
    batteryDoDOffset: -0.1,
    budgetReserveOffset: 5,
    powerMarginOffset: 10,
    thermalMarginOffset: 10,
    readinessOffset: 0,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function formatNumber(value) {
  return Number.isInteger(value)
    ? String(value)
    : String(roundToTwoDecimals(value));
}

/**
 * Updates the readable objective title after difficulty adjustment.
 */
function updateObjectiveTitle(objective) {
  const title = objective.title || '';

  switch (objective.type) {
    case 'data_volume':
      if (Number.isFinite(objective.targetValueGB)) {
        return title.replace(
          /\d+(?:\.\d+)?\s*GB/i,
          `${formatNumber(objective.targetValueGB)} GB`
        );
      }
      return title;

    case 'downlink_efficiency':
      if (Number.isFinite(objective.targetValuePercent)) {
        return title.replace(
          /([><=]\s*)\d+(?:\.\d+)?\s*%/,
          `$1${formatNumber(objective.targetValuePercent)}%`
        );
      }
      return title;

    case 'battery_health':
      if (Number.isFinite(objective.targetValueMaxDoD)) {
        return title.replace(
          /([><=]\s*)\d+(?:\.\d+)?\s*%/,
          `$1${formatNumber(objective.targetValueMaxDoD * 100)}%`
        );
      }
      return title;

    case 'budget_performance':
      if (Number.isFinite(objective.targetReservePercent)) {
        return title.replace(
          /\d+(?:\.\d+)?\s*%/,
          `${formatNumber(objective.targetReservePercent)}%`
        );
      }
      return title;

    case 'operational_readiness':
      if (Number.isFinite(objective.targetValuePercent)) {
        return title.replace(
          /\d+(?:\.\d+)?\s*%/,
          `${formatNumber(objective.targetValuePercent)}%`
        );
      }
      return title;

    default:
      return title;
  }
}

/**
 * Creates a readable target label for each supported objective.
 */
function createTargetLabel(objective) {
  switch (objective.type) {
    case 'data_volume':
      return Number.isFinite(objective.targetValueGB)
        ? `Target: ${formatNumber(objective.targetValueGB)} GB`
        : null;

    case 'downlink_efficiency':
      return Number.isFinite(objective.targetValuePercent)
        ? `Target: ${formatNumber(objective.targetValuePercent)}%`
        : null;

    case 'battery_health':
      return Number.isFinite(objective.targetValueMaxDoD)
        ? `Maximum DoD: ${formatNumber(
            objective.targetValueMaxDoD * 100
          )}%`
        : null;

    case 'budget_performance':
      return Number.isFinite(objective.targetReservePercent)
        ? `Budget reserve: ${formatNumber(
            objective.targetReservePercent
          )}%`
        : null;

    case 'power_margin':
      return Number.isFinite(objective.targetValuePercent)
        ? `Power margin: ${formatNumber(
            objective.targetValuePercent
          )}%`
        : null;

    case 'thermal_margin':
      return Number.isFinite(objective.targetValueMinWatts)
        ? `Thermal margin: ${formatNumber(
            objective.targetValueMinWatts
          )} W`
        : null;

    case 'operational_readiness':
      return Number.isFinite(objective.targetValuePercent)
        ? `Readiness: ${formatNumber(
            objective.targetValuePercent
          )}%`
        : null;

    case 'orbital_insertion':
      return Number.isFinite(objective.targetValueDeltaVMs)
        ? `Required delta-V: ${formatNumber(
            objective.targetValueDeltaVMs
          )} m/s`
        : null;

    default:
      return null;
  }
}

/**
 * Applies a gameplay difficulty profile to campaign objectives.
 *
 * The original campaign and its objective objects are never mutated.
 * Unsupported difficulty values safely fall back to Standard.
 */
export function applyDifficultyToObjectives(
  objectives,
  difficulty = GAMEPLAY_DIFFICULTY.STANDARD
) {
  if (!Array.isArray(objectives)) {
    return [];
  }

  const profile =
    DIFFICULTY_PROFILES[difficulty] ??
    DIFFICULTY_PROFILES[GAMEPLAY_DIFFICULTY.STANDARD];

  return objectives.map((originalObjective) => {
    const objective = { ...originalObjective };

    switch (objective.type) {
      case 'data_volume':
        if (Number.isFinite(objective.targetValueGB)) {
          objective.targetValueGB = roundToTwoDecimals(
            objective.targetValueGB * profile.dataVolumeMultiplier
          );
        }
        break;

      case 'downlink_efficiency':
        if (Number.isFinite(objective.targetValuePercent)) {
          objective.targetValuePercent = clamp(
            objective.targetValuePercent + profile.downlinkOffset,
            0,
            100
          );
        }
        break;

      case 'battery_health':
        if (Number.isFinite(objective.targetValueMaxDoD)) {
          objective.targetValueMaxDoD = roundToTwoDecimals(
            clamp(
              objective.targetValueMaxDoD + profile.batteryDoDOffset,
              0,
              1
            )
          );
        }
        break;

      case 'budget_performance':
        if (Number.isFinite(objective.targetReservePercent)) {
          objective.targetReservePercent = clamp(
            objective.targetReservePercent +
              profile.budgetReserveOffset,
            0,
            100
          );

          if (typeof objective.description === 'string') {
            objective.description = objective.description.replace(
              /\d+(?:\.\d+)?\s*%/,
              `${formatNumber(objective.targetReservePercent)}%`
            );
          }
        }
        break;

      case 'power_margin':
        if (Number.isFinite(objective.targetValuePercent)) {
          objective.targetValuePercent = clamp(
            objective.targetValuePercent + profile.powerMarginOffset,
            0,
            100
          );
        }
        break;

      case 'thermal_margin':
        if (Number.isFinite(objective.targetValueMinWatts)) {
          objective.targetValueMinWatts = Math.max(
            0,
            objective.targetValueMinWatts +
              profile.thermalMarginOffset
          );
        }
        break;

      case 'operational_readiness':
        if (Number.isFinite(objective.targetValuePercent)) {
          objective.targetValuePercent = clamp(
            objective.targetValuePercent + profile.readinessOffset,
            0,
            100
          );
        }
        break;

      // Orbital insertion is deliberately not adjusted.
      // Required delta-V remains a physical mission requirement.
      case 'orbital_insertion':
      default:
        break;
    }

    objective.title = updateObjectiveTitle(objective);
    objective.difficultyTargetLabel = createTargetLabel(objective);

    return objective;
  });
}
