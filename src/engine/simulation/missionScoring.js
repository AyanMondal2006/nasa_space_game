/**
 * Mission Scoring & Evaluation Engine
 * Transparent, documented scoring model evaluating science return, objective completion,
 * resource efficiency, budget performance, and design margin.
 */

export function calculateMissionScore({
  mission,
  simulationState,
  validationMetrics,
}) {
  const objectives = mission?.objectives || [];
  const durationDays = mission?.durationDays || 180;
  const budgetLimitUSD = mission?.budgetLimitUSD || 200_000_000;

  // 1. Primary Objective Completion (35% default weight)
  const primaryObjs = objectives.filter(o => o.isPrimary);
  const secondaryObjs = objectives.filter(o => !o.isPrimary);

  let primaryCompletionFraction = 0;
  if (primaryObjs.length > 0) {
    const totalPrimaryScore = primaryObjs.reduce((acc, obj) => {
      const progress = simulationState.objectivesProgress?.[obj.id] || 0;
      return acc + Math.min(1.0, progress / 100);
    }, 0);
    primaryCompletionFraction = totalPrimaryScore / primaryObjs.length;
  } else {
    primaryCompletionFraction = (simulationState.totalDataDownlinkedMB > 1000) ? 1.0 : 0.5;
  }

  // 2. Secondary Science Objectives & Scientific Value (15% weight)
  let secondaryCompletionFraction = 1.0;
  if (secondaryObjs.length > 0) {
    const totalSecScore = secondaryObjs.reduce((acc, obj) => {
      const progress = simulationState.objectivesProgress?.[obj.id] || 0;
      return acc + Math.min(1.0, progress / 100);
    }, 0);
    secondaryCompletionFraction = totalSecScore / secondaryObjs.length;
  }

  // Total scientific raw score from installed instruments
  const instruments = mission?.spacecraft?.instruments || [];
  const instrumentScienceValue = instruments.reduce((sum, inst) => sum + (inst.scienceValue || 20), 0);
  const scienceValueScore = Math.min(1.0, instrumentScienceValue / 100);

  // 3. Resource Efficiency (15% weight)
  // Evaluates battery health (average DoD < 60%) and solar margin
  const batteryHealth = simulationState.subsystemHealth?.battery || 100;
  const powerMarginScore = Math.min(1.0, Math.max(0, (validationMetrics?.power?.daylightPowerMarginPercent || 30) / 40));
  const resourceEfficiencyScore = ((batteryHealth / 100) * 0.6) + (powerMarginScore * 0.4);

  // 4. Budget Performance (10% weight)
  // Rewarded for staying under budget while meeting objectives
  const totalCost = validationMetrics?.budget?.totalCost || 0;
  const remainingBudget = Math.max(0, budgetLimitUSD - totalCost);
  const budgetUtilizationFraction = totalCost / budgetLimitUSD;
  // Optimal budget score is achieving objectives with 10-20% budget surplus
  let budgetScore = 0.5;
  if (budgetUtilizationFraction <= 0.85) {
    budgetScore = 1.0;
  } else if (budgetUtilizationFraction <= 1.0) {
    budgetScore = 0.8 + (0.2 * ((1.0 - budgetUtilizationFraction) / 0.15));
  } else {
    budgetScore = Math.max(0, 0.5 - (budgetUtilizationFraction - 1.0) * 2);
  }

  // 5. Data Return & Downlink Efficiency (10% weight)
  const collectedMB = simulationState.totalDataCollectedMB || 1;
  const downlinkedMB = simulationState.totalDataDownlinkedMB || 0;
  const downlinkEfficiencyFraction = Math.min(1.0, downlinkedMB / collectedMB);

  // 6. Reliability & Subsystem Health (10% weight)
  const healthValues = Object.values(simulationState.subsystemHealth || {});
  const avgHealth = healthValues.length > 0
    ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length
    : 100;
  const reliabilityScore = avgHealth / 100;

  // 7. Design Margin (5% weight)
  const massMarginFraction = validationMetrics?.mass?.massMarginFraction || 0.20;
  const designMarginScore = Math.min(1.0, massMarginFraction / 0.20);

  // Overall Weighted Score calculation
  // Critical Rule: A mission CANNOT achieve a high score if primary objectives failed.
  const rawWeightedScore = (
    (primaryCompletionFraction * 35) +
    (scienceValueScore * 15) +
    (resourceEfficiencyScore * 15) +
    (budgetScore * 10) +
    (downlinkEfficiencyFraction * 10) +
    (reliabilityScore * 10) +
    (designMarginScore * 5)
  );

  // Failure penalty: if primary objective failed or mission status is 'FAILED'
  const isFailed = simulationState.status === 'FAILED' || primaryCompletionFraction < 0.4;
  const finalScore = isFailed 
    ? Math.min(45, Math.round(rawWeightedScore * 0.4)) 
    : Math.round(rawWeightedScore);

  // Grade assignment
  let grade = 'F';
  if (finalScore >= 93) grade = 'A+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 75) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 45) grade = 'D';
  else grade = 'F';

  // Analysis of decisions
  const achievements = [];
  const designMistakes = [];
  const recommendations = [];

  if (primaryCompletionFraction >= 0.95) {
    achievements.push('100% Primary Scientific Objectives Achieved');
  }
  if (downlinkEfficiencyFraction >= 0.90) {
    achievements.push('Flawless High-Throughput Ground Downlink Return');
  }
  if (avgHealth >= 95) {
    achievements.push('Zero Catastrophic Hardware Degradation or Brownouts');
  }
  if (budgetUtilizationFraction <= 0.85) {
    achievements.push(`Under Budget with $${(remainingBudget / 1e6).toFixed(1)}M Contingency Surplus`);
  }

  if (downlinkEfficiencyFraction < 0.6) {
    designMistakes.push('Severe Science Telemetry Backlog: High instrument generation choked low-bandwidth communications link.');
    recommendations.push('Upgrade to Ka-Band parabolic reflector or deep space optical laser terminal.');
  }

  if (batteryHealth < 75) {
    designMistakes.push('Excessive Battery Degradation: Depth of discharge during eclipses exceeded safety thresholds.');
    recommendations.push('Increase secondary battery capacity or shed payload load during planetary shadow.');
  }

  if (budgetUtilizationFraction > 0.98) {
    designMistakes.push('Near Financial Breach: Contingency reserves were almost exhausted.');
    recommendations.push('Select a more economical launch vehicle or smaller standard science bus.');
  }

  return {
    finalScore,
    grade,
    isSuccess: !isFailed && finalScore >= 60,
    breakdown: {
      primaryObjectives: Math.round(primaryCompletionFraction * 35),
      scienceValue: Math.round(scienceValueScore * 15),
      resourceEfficiency: Math.round(resourceEfficiencyScore * 15),
      budgetPerformance: Math.round(budgetScore * 10),
      dataDownlink: Math.round(downlinkEfficiencyFraction * 10),
      reliability: Math.round(reliabilityScore * 10),
      designMargin: Math.round(designMarginScore * 5),
    },
    metricsSummary: {
      primaryCompletionPercent: (primaryCompletionFraction * 100).toFixed(1),
      secondaryCompletionPercent: (secondaryCompletionFraction * 100).toFixed(1),
      downlinkEfficiencyPercent: (downlinkEfficiencyFraction * 100).toFixed(1),
      totalDataCollectedGB: ((simulationState.totalDataCollectedMB || 0) / 1024).toFixed(2),
      totalDataDownlinkedGB: ((simulationState.totalDataDownlinkedMB || 0) / 1024).toFixed(2),
      averageSubsystemHealthPercent: avgHealth.toFixed(1),
    },
    achievements,
    designMistakes,
    recommendations,
  };
}
