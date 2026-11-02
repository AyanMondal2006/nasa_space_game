import React from 'react';
import { Weight, Zap, DollarSign, Database, Radio, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatMass, formatPower, formatCurrency, formatDataSize, formatPercent } from '../../utils/formatters.js';

export default function ResourcePillarsBar({ validationResults, currentMission }) {
  if (!validationResults || !validationResults.metrics) return null;

  const { metrics, isValid, errors, warnings } = validationResults;
  const { mass, power, budget, data, comms } = metrics;

  return (
    <div className="w-full bg-space-950/90 border-b border-space-border px-4 sm:px-6 lg:px-8 py-2.5 backdrop-blur flex flex-wrap items-center justify-between gap-3 text-xs font-mono sticky top-16 z-20">
      {/* 6 Resource Pillars */}
      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
        {/* 1. Mass */}
        <div className="flex items-center gap-2" title="Total Wet Launch Mass with 20% margin">
          <Weight className="w-4 h-4 text-orbit-cyan" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Mass (Wet)</span>
            <span className="font-semibold text-slate-200">{formatMass(mass?.totalLaunchMass || 0)}</span>
          </div>
        </div>

        {/* 2. Power */}
        <div className="flex items-center gap-2" title="Daylight Power Margin (Generation - Load)">
          <Zap className={`w-4 h-4 ${power?.daylightPowerMarginW >= 0 ? 'text-amber-400' : 'text-crimson'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Solar / Load</span>
            <span className={`font-semibold ${power?.daylightPowerMarginW >= 0 ? 'text-slate-200' : 'text-crimson font-bold'}`}>
              {formatPower(power?.daylightGenerationW || 0)} / {formatPower(power?.daylightLoadW || 0)}
            </span>
          </div>
        </div>

        {/* 3. Budget */}
        <div className="flex items-center gap-2" title="Total Lifecycle Cost vs Budget Ceiling">
          <DollarSign className={`w-4 h-4 ${budget?.remainingBudget >= 0 ? 'text-emerald-400' : 'text-crimson'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cost / Budget</span>
            <span className={`font-semibold ${budget?.remainingBudget >= 0 ? 'text-slate-200' : 'text-crimson font-bold'}`}>
              {formatCurrency(budget?.totalCost || 0)} / {formatCurrency(budget?.budgetLimit || 0)}
            </span>
          </div>
        </div>

        {/* 4. Data Generation */}
        <div className="flex items-center gap-2" title="Daily Collected Data vs Onboard Storage">
          <Database className="w-4 h-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Storage / Day</span>
            <span className="font-semibold text-slate-200">
              {formatDataSize(data?.dailyDataVolumeMB || 0)} / {data?.storageCapacityGB || 0} GB
            </span>
          </div>
        </div>

        {/* 5. Communications */}
        <div className="flex items-center gap-2" title="Daily Downlink Capacity vs Backlog">
          <Radio className={`w-4 h-4 ${comms?.netDailyBacklogMB <= 0 ? 'text-orbit-cyan' : 'text-amber-400'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Downlink Throughput</span>
            <span className="font-semibold text-slate-200">
              {comms?.effectiveDownlinkRateMbps?.toFixed(1) || 0} Mbps
            </span>
          </div>
        </div>

        {/* 6. Mission Duration */}
        <div className="flex items-center gap-2" title="Planned Primary Mission Lifetime">
          <Clock className="w-4 h-4 text-blue-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</span>
            <span className="font-semibold text-slate-200">{currentMission?.durationDays || 90} Days</span>
          </div>
        </div>
      </div>

      {/* Flight Feasibility Status Badge */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>FLIGHT FEASIBLE</span>
            {warnings.length > 0 && (
              <span className="text-[10px] text-amber-400 ml-1">({warnings.length} warnings)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>CONSTRAINTS VIOLATED ({errors.length})</span>
          </div>
        )}
      </div>
    </div>
  );
}
