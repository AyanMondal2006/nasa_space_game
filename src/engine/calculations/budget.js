/**
 * Mission Cost & Budget Calculation Engine
 * Accounts for spacecraft hardware development, payload instruments, launch service procurement,
 * mission operations duration costs, and programmatic contingency reserves.
 */

export const DEFAULT_CONTINGENCY_FRACTION = 0.15; // 15% NASA standard programmatic cost contingency
export const BASE_OPERATIONS_DAILY_COST = 8500; // $8,500 / day ground station & flight operations team cost

/**
 * Calculates complete mission budget breakdown and compares with ceiling.
 * 
 * @param {object} params
 * @param {object} params.spacecraft - Spacecraft configuration
 * @param {object} params.launchVehicle - Selected launch vehicle
 * @param {number} params.missionDurationDays - Planned mission duration in days
 * @param {number} params.budgetLimit - Scenario available budget ceiling in USD
 * @param {number} [params.contingencyFraction=0.15] - Reserve fraction
 * @returns {object} Budget breakdown and validation
 */
export function calculateBudget({
  spacecraft = {},
  launchVehicle = null,
  missionDurationDays = 365,
  budgetLimit = 150_000_000,
  contingencyFraction = DEFAULT_CONTINGENCY_FRACTION,
}) {
  const {
    bus,
    power,
    battery,
    instruments = [],
    comms,
    adcs,
    computing,
    thermal,
    propulsion,
  } = spacecraft;

  // 1. Hardware component costs
  const busCost = Number(bus?.costUSD) || 0;
  const powerCost = (Number(power?.costUSD) || 0) + (Number(battery?.costUSD) || 0);
  const instrumentsCost = (instruments || []).reduce((acc, inst) => acc + (Number(inst.costUSD) || 0), 0);
  const commsCost = Number(comms?.costUSD) || 0;
  const adcsCost = Number(adcs?.costUSD) || 0;
  const computingCost = Number(computing?.costUSD) || 0;
  const thermalCost = Number(thermal?.costUSD) || 0;
  const propulsionCost = Number(propulsion?.costUSD) || 0;

  const totalHardwareCost = busCost +
    powerCost +
    instrumentsCost +
    commsCost +
    adcsCost +
    computingCost +
    thermalCost +
    propulsionCost;

  // 2. Launch Service Procurement
  const launchCost = Number(launchVehicle?.launchCostUSD) || 0;

  // 3. Ground Operations and Mission Support Cost
  const durationDays = Math.max(1, Number(missionDurationDays) || 30);
  // Scale operations cost slightly with instrument complexity
  const instrumentComplexityMult = 1 + (instruments.length * 0.1);
  const operationsCost = Math.round(durationDays * BASE_OPERATIONS_DAILY_COST * instrumentComplexityMult);

  // 4. Subtotal before contingency
  const directCost = totalHardwareCost + launchCost + operationsCost;

  // 5. Programmatic contingency reserve
  const contingencyCost = Math.round(directCost * contingencyFraction);

  // 6. Total estimated mission lifecycle cost
  const totalCost = directCost + contingencyCost;

  // 7. Comparison with budget ceiling
  const remainingBudget = budgetLimit - totalCost;
  const utilizationPercent = budgetLimit > 0 ? (totalCost / budgetLimit) * 100 : 100;

  let status = 'optimal';
  const issues = [];

  if (remainingBudget < 0) {
    status = 'critical';
    issues.push(`Mission cost ($${(totalCost / 1e6).toFixed(1)}M) exceeds available budget ceiling ($${(budgetLimit / 1e6).toFixed(1)}M) by $${(Math.abs(remainingBudget) / 1e6).toFixed(1)}M.`);
  } else if (utilizationPercent > 95) {
    status = 'warning';
    issues.push(`Budget utilization is dangerously high (${utilizationPercent.toFixed(1)}%). Less than 5% unallocated financial reserve.`);
  }

  return {
    busCost,
    powerCost,
    instrumentsCost,
    commsCost,
    adcsCost,
    computingCost,
    thermalCost,
    propulsionCost,
    totalHardwareCost,
    launchCost,
    operationsCost,
    contingencyCost,
    contingencyFraction,
    directCost,
    totalCost,
    budgetLimit,
    remainingBudget,
    utilizationPercent,
    status,
    issues,
    breakdown: [
      { name: 'Spacecraft Bus & Structure', cost: busCost, category: 'hardware' },
      { name: 'Power System & Storage', cost: powerCost, category: 'hardware' },
      { name: 'Scientific Payload Array', cost: instrumentsCost, category: 'instruments' },
      { name: 'Avionics, Comms & ADCS', cost: commsCost + adcsCost + computingCost, category: 'avionics' },
      { name: 'Thermal & Propulsion Systems', cost: thermalCost + propulsionCost, category: 'hardware' },
      { name: 'Launch Service Contract', cost: launchCost, category: 'launch' },
      { name: 'Ground & Flight Operations', cost: operationsCost, category: 'operations' },
      { name: 'Programmatic Contingency (15%)', cost: contingencyCost, category: 'reserve' },
    ],
  };
}
