
import React, { useEffect, useMemo, useState } from 'react';

import { useMission } from '../state/MissionContext.jsx';

import { generateRecommendations } from '../engine/optimization/recommendations.js';
import { validateMission } from '../engine/validation/validateMission.js';

import {
  GitCompare,
  Wrench,
  Check,
  Layers,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// --------------------------------------------------
// DISPLAY HELPERS
// --------------------------------------------------

function displayNumber(value, suffix = '', digits = 1) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(Number(value))
  ) {
    return 'Not evaluated';
  }

  return `${Number(value).toFixed(digits)}${suffix}`;
}

function displayCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(Number(value))
  ) {
    return 'Not evaluated';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function displayBoolean(value) {
  if (value === true) return 'Feasible';
  if (value === false) return 'Infeasible';

  return 'Not evaluated';
}

function displayStatus(value) {
  if (!value) return 'Not evaluated';

  return value.toString().replace(/_/g, ' ').toUpperCase();
}

function displayReadiness(metrics) {
  if (!metrics?.readiness) return 'Not available';

  const readiness = metrics.readiness;

  return `${readiness.percent}% (${readiness.passedChecks}/${readiness.totalChecks})`;
}

// --------------------------------------------------
// ENGINEERING COMPARISON MATRIX
// --------------------------------------------------

const COMPARISON_SECTIONS = [
  {
    title: 'MISSION CONFIGURATION',
    rows: [
      {
        id: 'destination',
        label: 'Target destination',
        getValue: ({ mission }) =>
          mission.destination?.toUpperCase() || 'Not specified',
      },
      {
        id: 'scenario',
        label: 'Mission scenario',
        getValue: ({ mission }) => mission.scenarioId || 'Custom',
      },
      {
        id: 'duration',
        label: 'Mission duration',
        getValue: ({ mission }) =>
          displayNumber(mission.durationDays, ' days', 0),
      },
      {
        id: 'launchVehicle',
        label: 'Launch vehicle',
        getValue: ({ mission }) =>
          mission.launchVehicle?.name || 'Not selected',
      },
    ],
  },
  {
    title: 'ORBITAL MECHANICS',
    rows: [
      {
        id: 'altitude',
        label: 'Orbital altitude',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.orbit?.altitudeKm, ' km'),
      },
      {
        id: 'inclination',
        label: 'Orbital inclination',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.orbit?.inclinationDeg, '°'),
      },
      {
        id: 'velocity',
        label: 'Circular orbital velocity',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.orbit?.velocityKms, ' km/s', 3),
      },
      {
        id: 'period',
        label: 'Orbital period',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.orbit?.periodMinutes, ' minutes'),
      },
    ],
  },
  {
    title: 'SPACECRAFT MASS & PROPULSION',
    rows: [
      {
        id: 'dryMass',
        label: 'Spacecraft dry mass',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.dryMass, ' kg'),
      },
      {
        id: 'massMargin',
        label: 'Engineering mass margin',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.massMargin, ' kg'),
      },
      {
        id: 'dryMassWithMargin',
        label: 'Dry mass including margin',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.dryMassWithMargin, ' kg'),
      },
      {
        id: 'propellant',
        label: 'Configured propellant',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.configuredPropellantMassKg, ' kg'),
      },
      {
        id: 'totalLaunchMass',
        label: 'Total launch mass',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.totalLaunchMass, ' kg'),
      },
      {
        id: 'requiredDeltaV',
        label: 'Required delta-V',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.requiredDeltaVMs, ' m/s'),
      },
      {
        id: 'availableDeltaV',
        label: 'Available delta-V',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.mass?.availableDeltaVMs, ' m/s'),
      },
      {
        id: 'deltaVFeasible',
        label: 'Propulsion delta-V feasibility',
        getValue: ({ metrics }) =>
          displayBoolean(metrics?.mass?.deltaVFeasible),
      },
    ],
  },
  {
    title: 'POWER & BATTERY',
    rows: [
      {
        id: 'generation',
        label: 'Daylight power generation',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.daylightGenerationW, ' W'),
      },
      {
        id: 'daylightLoad',
        label: 'Daylight electrical load',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.daylightLoadW, ' W'),
      },
      {
        id: 'powerMargin',
        label: 'Daylight power margin',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.daylightPowerMarginW, ' W'),
      },
      {
        id: 'batteryCapacity',
        label: 'Battery capacity',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.totalBatteryCapacityWh, ' Wh'),
      },
      {
        id: 'eclipseEnergy',
        label: 'Eclipse energy requirement',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.energyConsumedEclipseWh, ' Wh'),
      },
      {
        id: 'dod',
        label: 'Battery depth of discharge',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.power?.dodPercent, '%'),
      },
      {
        id: 'powerStatus',
        label: 'Power subsystem status',
        getValue: ({ metrics }) =>
          displayStatus(metrics?.power?.status),
      },
    ],
  },
  {
    title: 'MISSION BUDGET',
    rows: [
      {
        id: 'hardwareCost',
        label: 'Hardware cost',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.totalHardwareCost),
      },
      {
        id: 'launchCost',
        label: 'Launch cost',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.launchCost),
      },
      {
        id: 'operationsCost',
        label: 'Operations cost',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.operationsCost),
      },
      {
        id: 'totalCost',
        label: 'Estimated lifecycle cost',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.totalCost),
      },
      {
        id: 'budgetCeiling',
        label: 'Budget ceiling',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.budgetLimit),
      },
      {
        id: 'remainingBudget',
        label: 'Remaining budget',
        getValue: ({ metrics }) =>
          displayCurrency(metrics?.budget?.remainingBudget),
      },
      {
        id: 'budgetUtilization',
        label: 'Budget utilization',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.budget?.utilizationPercent, '%'),
      },
      {
        id: 'budgetStatus',
        label: 'Budget status',
        getValue: ({ metrics }) =>
          displayStatus(metrics?.budget?.status),
      },
    ],
  },
  {
    title: 'SCIENTIFIC DATA & STORAGE',
    rows: [
      {
        id: 'dailyData',
        label: 'Daily data generation',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.data?.dailyDataVolumeGB, ' GB/day'),
      },
      {
        id: 'storage',
        label: 'Onboard storage capacity',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.data?.storageCapacityGB, ' GB'),
      },
      {
        id: 'accumulatedData',
        label: 'Data accumulated between contacts',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.data?.accumulatedDataInGapGB, ' GB'),
      },
      {
        id: 'storageUtilization',
        label: 'Contact-gap storage utilization',
        getValue: ({ metrics }) =>
          displayNumber(
            metrics?.data?.gapStorageUtilizationPercent,
            '%'
          ),
      },
      {
        id: 'dataStatus',
        label: 'Data subsystem status',
        getValue: ({ metrics }) =>
          displayStatus(metrics?.data?.status),
      },
    ],
  },
  {
    title: 'COMMUNICATIONS & DOWNLINK',
    rows: [
      {
        id: 'bandwidth',
        label: 'Configured communication bandwidth',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.comms?.baseBandwidthMbps, ' Mbps'),
      },
      {
        id: 'effectiveRate',
        label: 'Effective downlink rate',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.comms?.effectiveDownlinkRateMbps, ' Mbps'),
      },
      {
        id: 'contactTime',
        label: 'Modelled daily contact time',
        getValue: ({ metrics }) =>
          displayNumber(
            metrics?.comms?.typicalContactMinutesPerDay,
            ' minutes',
            0
          ),
      },
      {
        id: 'downlinkCapacity',
        label: 'Daily downlink capacity',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.comms?.dailyDownlinkCapacityGB, ' GB/day'),
      },
      {
        id: 'backlog',
        label: 'Net daily data backlog',
        getValue: ({ metrics }) =>
          displayNumber(
            metrics?.comms?.netDailyBacklogMB == null
              ? null
              : metrics.comms.netDailyBacklogMB / 1024,
            ' GB/day'
          ),
      },
      {
        id: 'downlinkMargin',
        label: 'Downlink margin',
        getValue: ({ metrics }) =>
          displayNumber(metrics?.comms?.downlinkMarginPercent, '%'),
      },
      {
        id: 'commsStatus',
        label: 'Communications status',
        getValue: ({ metrics }) =>
          displayStatus(metrics?.comms?.status),
      },
    ],
  },
  {
    title: 'THERMAL ENGINEERING',
    rows: [
      {
        id: 'thermalMargin',
        label: 'Calculated thermal margin',
        getValue: ({ metrics }) => {
          const thermal = metrics?.thermal;

          if (!thermal?.isEvaluable) {
            return 'Not evaluated';
          }

          return displayNumber(thermal.thermalMarginW, ' W');
        },
      },
      {
        id: 'thermalStatus',
        label: 'Thermal model status',
        getValue: ({ metrics }) => {
          const thermal = metrics?.thermal;

          if (!thermal?.isEvaluable) {
            return 'NOT EVALUATED';
          }

          return thermal.thermalMarginW >= 0
            ? 'PASS'
            : 'REQUIRES ATTENTION';
        },
      },
    ],
  },
  {
    title: 'MISSION READINESS & VALIDATION',
    rows: [
      {
        id: 'readiness',
        label: 'Operational readiness',
        getValue: ({ metrics }) =>
          displayReadiness(metrics),
      },
      {
        id: 'validationErrors',
        label: 'Validation errors',
        getValue: ({ validation }) =>
          validation
            ? validation.errors.length
            : 'Not available',
      },
      {
        id: 'validationWarnings',
        label: 'Validation warnings',
        getValue: ({ validation }) =>
          validation
            ? validation.warnings.length
            : 'Not available',
      },
      {
        id: 'validationStatus',
        label: 'Overall validation',
        getValue: ({ validation }) => {
          if (!validation) return 'NOT AVAILABLE';

          return validation.isValid
            ? 'NO BLOCKING ERRORS'
            : 'REQUIRES ATTENTION';
        },
      },
    ],
  },
];


// --------------------------------------------------
// COMPARISON PAGE
// --------------------------------------------------

export default function ComparisonPage() {
  const {
    savedMissions,
    currentMission,
    validationResults,
    updateSpacecraft,
    updateLaunchVehicle,
    loadSavedMission,
  } = useMission();

  const [selectedIds, setSelectedIds] = useState(() => {
    return savedMissions.slice(0, 3).map(mission => mission.id);
  });

  const [operationNotice, setOperationNotice] = useState(null);

  // Keep selections synchronized when saved missions are added or deleted.
  useEffect(() => {
    setSelectedIds(previousIds => {
      const availableIds = savedMissions.map(mission => mission.id);

      const retainedIds = previousIds
        .filter(id => availableIds.includes(id))
        .slice(0, 3);

      if (retainedIds.length > 0) {
        return retainedIds;
      }

      return availableIds.slice(0, 3);
    });
  }, [savedMissions]);

  // Generate recommendations for the currently active mission.
  const recommendations = generateRecommendations(
    currentMission,
    validationResults
  );

  // --------------------------------------------------
  // INDEPENDENT VALIDATION OF EACH SAVED MISSION
  // --------------------------------------------------

  const comparisonData = useMemo(() => {
    return savedMissions
      .filter(mission => selectedIds.includes(mission.id))
      .slice(0, 3)
      .map(mission => {
        try {
          const validation = validateMission(mission);

          return {
            mission,
            validation,
            metrics: validation?.metrics ?? null,
            calculationError: null,
          };

        } catch (error) {
          return {
            mission,
            validation: null,
            metrics: null,
            calculationError: error.message,
          };
        }
      });
  }, [savedMissions, selectedIds]);

  // --------------------------------------------------
  // MISSION SELECTION
  // --------------------------------------------------

  const toggleSelectMission = (id) => {
    setSelectedIds(previousIds => {
      if (previousIds.includes(id)) {
        if (previousIds.length <= 1) {
          return previousIds;
        }

        return previousIds.filter(item => item !== id);
      }

      if (previousIds.length >= 3) {
        setOperationNotice({
          type: 'warning',
          message: 'A maximum of three mission designs can be compared.',
        });

        return previousIds;
      }

      return [...previousIds, id];
    });
  };

  // --------------------------------------------------
  // APPLY OPTIMIZATION RECOMMENDATION
  // --------------------------------------------------

  const handleApplyRecommendation = (recommendation) => {
    if (recommendation.actionType === 'SET_LAUNCH_VEHICLE') {
      updateLaunchVehicle(recommendation.targetValue);

    } else if (recommendation.actionType === 'SET_BATTERY') {
      updateSpacecraft('battery', recommendation.targetValue);

    } else if (recommendation.actionType === 'SET_POWER') {
      updateSpacecraft('power', recommendation.targetValue);

    } else if (recommendation.actionType === 'SET_COMPUTING') {
      updateSpacecraft('computing', recommendation.targetValue);

    } else if (recommendation.actionType === 'SET_COMMS') {
      updateSpacecraft('comms', recommendation.targetValue);
    }

    setOperationNotice({
      type: 'success',
      message: 'Recommendation applied to the active mission design.',
    });
  };

  // --------------------------------------------------
  // LOAD SELECTED DESIGN
  // --------------------------------------------------

  const handleLoadMission = (mission) => {
    const result = loadSavedMission(mission);

    if (!result?.success) {
      setOperationNotice({
        type: 'error',
        message: result?.error || 'Unable to load the selected mission.',
      });

      return;
    }

    setOperationNotice({
      type: result.persisted ? 'success' : 'warning',
      message: result.persisted
        ? `"${mission.title}" loaded into Mission Designer.`
        : result.error,
    });
  };

  return (
    <div className="space-y-8 pb-16">

      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <GitCompare className="w-3.5 h-3.5" />

          <span>
            MULTI-MISSION COMPARISON & ENGINEERING ANALYSIS
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Design Comparison & Optimizer
        </h1>

        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Compare up to three saved mission architectures using independently
          calculated mass, propulsion, power, budget, data, communications,
          orbital and operational-readiness metrics.
        </p>
      </div>

      {/* OPERATION FEEDBACK */}
      {operationNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            operationNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : operationNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {operationNotice.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}

          <span>{operationNotice.message}</span>
        </div>
      )}

      {/* AUTOMATED RECOMMENDATION ENGINE */}
      <div className="space-panel p-6 border-orbit-cyan/30 space-y-4 bg-space-900/80">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orbit-cyan" />

            <h2 className="text-base font-bold font-mono text-white">
              Automated Design Recommendations for "{currentMission?.title}"
            </h2>
          </div>

          <span className="text-xs font-mono text-orbit-cyan px-2 py-0.5 rounded bg-orbit-cyan/10 border border-orbit-cyan/30">
            {recommendations.length} Suggestions
          </span>

        </div>

        {recommendations.length === 0 ? (

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4" />

            <span>
              Optimal Architecture: No immediate constraint violations
              or subsystem bottlenecks detected.
            </span>
          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {recommendations.map(recommendation => (
              <div
                key={recommendation.id}
                className="p-4 rounded-lg bg-space-950/80 border border-space-border space-y-2 flex flex-col justify-between"
              >

                <div className="space-y-1">

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30 uppercase">
                    {recommendation.category}
                  </span>

                  <h4 className="font-mono font-bold text-sm text-white">
                    {recommendation.title}
                  </h4>

                  <p className="text-xs text-slate-400">
                    {recommendation.reason}
                  </p>

                  <p className="text-xs font-mono text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {recommendation.impactDescription}
                  </p>

                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleApplyRecommendation(recommendation)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded bg-space-850 hover:bg-orbit-cyan hover:text-space-950 text-slate-200 font-mono text-xs font-bold transition border border-space-border"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Apply This Suggestion</span>
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* MISSION SELECTION */}
      <div className="space-panel p-6 space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              Select Mission Architectures
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Select between one and three saved mission configurations.
            </p>
          </div>

          <span className="text-xs font-mono text-orbit-cyan">
            {comparisonData.length}/3 Selected
          </span>

        </div>

        {savedMissions.length === 0 ? (

          <div className="py-8 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />

            <p className="text-xs text-slate-400 font-mono">
              No saved missions are available. Save mission designs first.
            </p>
          </div>

        ) : (

          <div className="flex flex-wrap gap-2">

            {savedMissions.map(mission => {
              const selected = selectedIds.includes(mission.id);

              return (
                <button
                  key={mission.id}
                  onClick={() => toggleSelectMission(mission.id)}
                  aria-pressed={selected}
                  className={`px-3 py-2 rounded border transition text-xs font-mono ${
                    selected
                      ? 'bg-orbit-cyan text-space-950 border-orbit-cyan font-bold'
                      : 'bg-space-900 border-space-border text-slate-400 hover:text-white'
                  }`}
                >
                  {selected ? '✓ ' : ''}
                  {mission.title}
                </button>
              );
            })}

          </div>
        )}

        {savedMissions.length > 3 && (
          <p className="text-[10px] font-mono text-slate-500">
            Maximum three missions can be selected simultaneously.
          </p>
        )}

      </div>

      {/* ENGINEERING COMPARISON MATRIX */}
      <div className="space-panel p-6 space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              Engineering Performance Comparison
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Every column represents an independently validated mission design.
            </p>
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            UNITS SHOWN WITH EACH METRIC
          </span>

        </div>

        {comparisonData.length === 0 ? (

          <p className="text-xs text-slate-400 font-mono py-8 text-center">
            Select at least one saved mission to display its calculated
            engineering performance.
          </p>

        ) : (

          <>
            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-left text-xs font-mono border-collapse">

                <thead>
                  <tr className="border-b border-space-border text-slate-400">

                    <th className="py-3 px-3 min-w-[210px]">
                      METRIC / SPECIFICATION
                    </th>

                    {comparisonData.map(item => (
                      <th
                        key={item.mission.id}
                        className="py-3 px-3 text-orbit-cyan font-bold min-w-[180px]"
                      >
                        {item.mission.title}
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody className="divide-y divide-space-border/50 text-slate-200">

                  {COMPARISON_SECTIONS.map(section => (
                    <React.Fragment key={section.title}>

                      <tr className="bg-space-950/70">
                        <td
                          colSpan={comparisonData.length + 1}
                          className="px-3 py-3 text-orbit-cyan font-bold uppercase tracking-wider"
                        >
                          {section.title}
                        </td>
                      </tr>

                      {section.rows.map(row => (

                        <tr key={row.id} className="hover:bg-space-850/50">

                          <td className="py-2.5 px-3 text-slate-400">
                            {row.label}
                          </td>

                          {comparisonData.map(item => {

                            const value = row.getValue(item);

                            const hasCalculationError =
                              Boolean(item.calculationError);

                            return (
                              <td
                                key={item.mission.id}
                                className="py-2.5 px-3 text-slate-200"
                                title={
                                  hasCalculationError
                                    ? item.calculationError
                                    : row.id === 'thermalMargin'
                                      ? item.metrics?.thermal?.reason || ''
                                      : ''
                                }
                              >
                                {hasCalculationError
                                  ? 'Calculation unavailable'
                                  : value}
                              </td>
                            );
                          })}

                        </tr>

                      ))}

                    </React.Fragment>
                  ))}

                  {/* LOAD DESIGN ACTION */}
                  <tr className="border-t border-space-border">

                    <td className="py-3 px-3 text-slate-400 font-bold">
                      ACTION
                    </td>

                    {comparisonData.map(item => (
                      <td key={item.mission.id} className="py-3 px-3">

                        <button
                          onClick={() => handleLoadMission(item.mission)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-xs font-mono transition"
                        >
                          Load Into Designer

                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    ))}

                  </tr>

                </tbody>

              </table>

            </div>

            <div className="pt-3 border-t border-space-border/50 space-y-2">

              <p className="text-[10px] text-slate-500 font-mono">
                ENGINEERING MODEL NOTES
              </p>

              <p className="text-xs text-slate-400 leading-relaxed">
                These values are generated by ASTRAJECT's current educational
                engineering models. They represent calculated estimates,
                not certified spacecraft performance.
              </p>

              <p className="text-xs text-amber-300 leading-relaxed">
                Thermal margin is displayed as "Not evaluated" when the
                validation engine does not have sufficient inputs to
                calculate it.
              </p>

              <p className="text-xs text-slate-500 leading-relaxed">
                A positive data backlog indicates that generated data exceeds
                modelled downlink capacity. A negative value indicates
                available downlink surplus.
              </p>

            </div>

          </>

        )}

      </div>

    </div>
  );
}
