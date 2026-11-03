/**
 * Mission Scoring & Evaluation Engine
 *
 * Produces a transparent 0-100 mission score from objective completion,
 * scientific capability, resources, budget, data return, reliability,
 * and mass design margin.
 *
 * Scoring weights (total = 100):
 *   Primary objectives             35
 *   Secondary objectives + science 15
 *   Resource efficiency            15
 *   Budget performance             10
 *   Data return / downlink          10
 *   Subsystem reliability           10
 *   Mass design margin               5
 *
 * Missing evidence is not treated as a perfect result. This is an
 * educational game score, not a certified aerospace mission assessment.
 */

const DEFAULT_BUDGET_LIMIT_USD = 200_000_000;
const FAILURE_SCORE_CAP = 45;
const SUCCESS_SCORE_THRESHOLD = 60;
const PRIMARY_FAILURE_THRESHOLD = 0.4;

const SCORE_WEIGHTS = Object.freeze({
  primaryObjectives: 35,
  scienceValue: 15,
  resourceEfficiency: 15,
  budgetPerformance: 10,
  dataDownlink: 10,
  reliability: 10,
  designMargin: 5,
});

function finiteNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, minimum = 0, maximum = 1) {
  const parsed = finiteNumber(value, minimum);
  return Math.min(maximum, Math.max(minimum, parsed));
}

function readProgress(objectivesProgress, objectiveId) {
  const raw = objectivesProgress?.[objectiveId];
  const value = finiteNumber(raw, 0);
  return clamp(value, 0, 100) / 100;
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function readHealthPercent(value) {
  const parsed = finiteNumber(value, 0);
  return clamp(parsed, 0, 100);
}

function calculateObjectiveCompletion(objectives, objectivesProgress, isPrimary) {
  const selected = objectives.filter((objective) => Boolean(objective?.isPrimary) === isPrimary);
  if (selected.length === 0) return null;

  return average(selected.map((objective) =>
    readProgress(objectivesProgress, objective.id)
  ));
}

function calculateScienceValueScore(instruments) {
  const totalScienceValue = instruments.reduce((sum, instrument) => {
    const value = finiteNumber(instrument?.scienceValue, 0);
    return sum + Math.max(0, value ?? 0);
  }, 0);

  return clamp(totalScienceValue / 100);
}

/**
 * Calculate the final mission score.
 *
 * Backwards-compatible input:
 *   calculateMissionScore({ mission, simulationState, validationMetrics })
 *
 * Backwards-compatible output keys are retained for ReportsPage.jsx.
 */
export function calculateMissionScore({
  mission = {},
  simulationState = {},
  validationMetrics = null,
} = {}) {
  const safeMission = mission && typeof mission === 'object' ? mission : {};
  const safeState = simulationState && typeof simulationState === 'object'
    ? simulationState
    : {};
  const safeMetrics = validationMetrics && typeof validationMetrics === 'object'
    ? validationMetrics
    : null;

  const objectives = Array.isArray(safeMission.objectives)
    ? safeMission.objectives
    : [];
  const objectivesProgress = safeState.objectivesProgress && typeof safeState.objectivesProgress === 'object'
    ? safeState.objectivesProgress
    : {};
  const instruments = Array.isArray(safeMission.spacecraft?.instruments)
    ? safeMission.spacecraft.instruments
    : [];

  const configuredBudgetLimit = finiteNumber(safeMission.budgetLimitUSD, DEFAULT_BUDGET_LIMIT_USD);
  const budgetLimitUSD = configuredBudgetLimit !== null && configuredBudgetLimit > 0
    ? configuredBudgetLimit
    : 0;

  const collectedMB = Math.max(0, finiteNumber(safeState.totalDataCollectedMB, 0) ?? 0);
  const downlinkedMB = Math.max(0, finiteNumber(safeState.totalDataDownlinkedMB, 0) ?? 0);
  const downlinkEfficiencyFraction = collectedMB > 0
    ? clamp(downlinkedMB / collectedMB)
    : 0;

  // 1. Primary objective completion (35 points).
  let primaryCompletionFraction = calculateObjectiveCompletion(
    objectives,
    objectivesProgress,
    true,
  );

  // Preserve the legacy fallback for campaigns without explicit primary objectives.
  if (primaryCompletionFraction === null) {
    primaryCompletionFraction = downlinkedMB > 1000 ? 1 : 0.5;
  }

  // 2. Secondary objectives and installed scientific capability (15 points total).
  let secondaryCompletionFraction = calculateObjectiveCompletion(
    objectives,
    objectivesProgress,
    false,
  );
  // No secondary objectives means there is no secondary objective penalty.
  if (secondaryCompletionFraction === null) secondaryCompletionFraction = 1;

  const scienceValueScore = calculateScienceValueScore(instruments);
  // The existing 15-point science category is shared equally between secondary
  // objective completion and the scientific value of the installed instruments.
  const combinedScienceScore = (secondaryCompletionFraction + scienceValueScore) / 2;

  // 3. Resource efficiency (15 points).
  const subsystemHealth = safeState.subsystemHealth && typeof safeState.subsystemHealth === 'object'
    ? safeState.subsystemHealth
    : {};
  const batteryHealth = readHealthPercent(subsystemHealth.battery);

  const powerMargin = finiteNumber(safeMetrics?.power?.daylightPowerMarginPercent, null);
  const powerMarginScore = powerMargin === null ? 0 : clamp(powerMargin / 40);
  const resourceEfficiencyScore =
    ((batteryHealth / 100) * 0.6) + (powerMarginScore * 0.4);

  // 4. Budget performance (10 points). Missing validation evidence earns zero.
  const totalCost = finiteNumber(safeMetrics?.budget?.totalCost, null);
  let budgetUtilizationFraction = null;
  let remainingBudget = 0;
  let budgetScore = 0;

  if (totalCost !== null && totalCost >= 0 && budgetLimitUSD > 0) {
    budgetUtilizationFraction = totalCost / budgetLimitUSD;
    remainingBudget = Math.max(0, budgetLimitUSD - totalCost);

    if (budgetUtilizationFraction <= 0.85) {
      budgetScore = 1;
    } else if (budgetUtilizationFraction <= 1) {
      budgetScore = 0.8 + (0.2 * ((1 - budgetUtilizationFraction) / 0.15));
    } else {
      budgetScore = clamp(0.5 - ((budgetUtilizationFraction - 1) * 2));
    }
  }

  // 5. Data return / downlink efficiency (10 points).
  // A mission with no recorded science data receives no data-return credit.

  // 6. Reliability (10 points). Missing subsystem health is not assumed to be 100%.
  const healthValues = Object.values(subsystemHealth)
    .map(readHealthPercent);
  const avgHealth = average(healthValues);
  const reliabilityScore = avgHealth / 100;

  // 7. Mass design margin (5 points). Missing evidence earns zero.
  const massMarginFraction = finiteNumber(safeMetrics?.mass?.massMarginFraction, null);
  const designMarginScore = massMarginFraction === null
    ? 0
    : clamp(massMarginFraction / 0.20);

  const rawWeightedScore =
    (primaryCompletionFraction * SCORE_WEIGHTS.primaryObjectives) +
    (combinedScienceScore * SCORE_WEIGHTS.scienceValue) +
    (resourceEfficiencyScore * SCORE_WEIGHTS.resourceEfficiency) +
    (budgetScore * SCORE_WEIGHTS.budgetPerformance) +
    (downlinkEfficiencyFraction * SCORE_WEIGHTS.dataDownlink) +
    (reliabilityScore * SCORE_WEIGHTS.reliability) +
    (designMarginScore * SCORE_WEIGHTS.designMargin);

  const boundedRawScore = clamp(rawWeightedScore, 0, 100);
  const missionStatus = safeState.status;
  const isMissionCompleted = missionStatus === 'COMPLETED';
  const isExplicitlyFailed = missionStatus === 'FAILED';
  const primaryObjectivesFailed = primaryCompletionFraction < PRIMARY_FAILURE_THRESHOLD;
  const isFailed = isExplicitlyFailed || primaryObjectivesFailed;

  const finalScore = isFailed
    ? Math.min(FAILURE_SCORE_CAP, Math.round(boundedRawScore * 0.4))
    : Math.round(boundedRawScore);

  let grade = 'F';
  if (finalScore >= 93) grade = 'A+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 75) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 45) grade = 'D';

  // A mission must reach COMPLETED status to be declared successful.
  const isSuccess = isMissionCompleted && !isFailed && finalScore >= SUCCESS_SCORE_THRESHOLD;

  const achievements = [];
  const designMistakes = [];
  const recommendations = [];

  if (primaryCompletionFraction >= 0.95) {
    achievements.push('Primary Scientific Objectives Achieved');
  }
  if (secondaryCompletionFraction >= 0.95 && objectives.some((objective) => !objective?.isPrimary)) {
    achievements.push('Secondary Scientific Objectives Achieved');
  }
  if (downlinkEfficiencyFraction >= 0.90) {
    achievements.push('High-Throughput Ground Downlink Return');
  }
  if (avgHealth >= 95 && healthValues.length > 0) {
    achievements.push('Excellent Subsystem Health Maintained');
  }
  if (budgetUtilizationFraction !== null && budgetUtilizationFraction <= 0.85) {
    achievements.push(`Under Budget with $${(remainingBudget / 1e6).toFixed(1)}M Contingency Surplus`);
  }

  if (primaryCompletionFraction < 0.95) {
    designMistakes.push('Primary mission objectives were not fully achieved.');
    recommendations.push('Review the mission objectives, payload selection, and operating plan to improve primary objective completion.');
  }
  if (downlinkEfficiencyFraction < 0.6) {
    designMistakes.push('Severe Science Telemetry Backlog: A substantial fraction of collected science data was not returned.');
    recommendations.push('Increase communication capacity or ground-contact opportunities, or reduce payload data generation.');
  }
  if (batteryHealth < 75) {
    designMistakes.push('Low Battery Subsystem Health: Battery condition fell below the recommended game threshold.');
    recommendations.push('Increase battery capacity or reduce payload load during eclipse.');
  }
  if (budgetUtilizationFraction !== null && budgetUtilizationFraction > 0.98) {
    designMistakes.push('Near Financial Breach: Contingency reserves were almost exhausted.');
    recommendations.push('Select more economical hardware or a lower-cost launch service.');
  }
  if (powerMargin === null || massMarginFraction === null || totalCost === null) {
    designMistakes.push('Some validation evidence was unavailable when the mission score was calculated.');
    recommendations.push('Run complete mission validation before treating the score as a final engineering assessment.');
  }
  if (!isMissionCompleted && !isExplicitlyFailed) {
    recommendations.push('Mission is still in progress. Complete the planned mission before interpreting this as a final score.');
  }

  // Keep legacy report fields intact. The scienceValue breakdown includes both
  // secondary-objective completion and installed-instrument science value.
  const breakdown = {
    primaryObjectives: Math.round(primaryCompletionFraction * SCORE_WEIGHTS.primaryObjectives),
    scienceValue: Math.round(combinedScienceScore * SCORE_WEIGHTS.scienceValue),
    resourceEfficiency: Math.round(resourceEfficiencyScore * SCORE_WEIGHTS.resourceEfficiency),
    budgetPerformance: Math.round(budgetScore * SCORE_WEIGHTS.budgetPerformance),
    dataDownlink: Math.round(downlinkEfficiencyFraction * SCORE_WEIGHTS.dataDownlink),
    reliability: Math.round(reliabilityScore * SCORE_WEIGHTS.reliability),
    designMargin: Math.round(designMarginScore * SCORE_WEIGHTS.designMargin),
  };

  return {
    finalScore,
    grade,
    isSuccess,
    breakdown,
    metricsSummary: {
      primaryCompletionPercent: (primaryCompletionFraction * 100).toFixed(1),
      secondaryCompletionPercent: (secondaryCompletionFraction * 100).toFixed(1),
      downlinkEfficiencyPercent: (downlinkEfficiencyFraction * 100).toFixed(1),
      totalDataCollectedGB: (collectedMB / 1024).toFixed(2),
      totalDataDownlinkedGB: (downlinkedMB / 1024).toFixed(2),
      averageSubsystemHealthPercent: avgHealth.toFixed(1),
    },
    achievements,
    designMistakes,
    recommendations,
  };
}

export { SCORE_WEIGHTS };
