import React, { useState } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { 
  BUS_CATALOG, 
  POWER_CATALOG, 
  BATTERY_CATALOG, 
  INSTRUMENT_CATALOG, 
  COMMS_CATALOG, 
  ADCS_CATALOG, 
  COMPUTING_CATALOG, 
  THERMAL_CATALOG, 
  PROPULSION_CATALOG 
} from '../data/spacecraftComponents.js';
import SpacecraftViewer3D from '../components/visualization/SpacecraftViewer3D.jsx';
import CanvasErrorBoundary from '../components/common/CanvasErrorBoundary.jsx';
import { 
  Cpu, 
  Zap, 
  Radio, 
  Orbit, 
  Thermometer, 
  Flame, 
  HardDrive, 
  Layers, 
  Weight, 
  DollarSign, 
  Check, 
  Trash2,
  Plus
} from 'lucide-react';
import { formatCurrency, formatMass, formatPower } from '../utils/formatters.js';

export default function SpacecraftLabPage() {
  const { currentMission, updateSpacecraft, validationResults } = useMission();
  const [activeCategory, setActiveCategory] = useState('bus');

  const spacecraft = currentMission?.spacecraft || {};
  const { metrics } = validationResults || {};

  const categories = [
    { id: 'bus', name: 'Bus Structure', icon: Layers, catalog: BUS_CATALOG, current: spacecraft.bus },
    { id: 'power', name: 'Power Array', icon: Zap, catalog: POWER_CATALOG, current: spacecraft.power },
    { id: 'battery', name: 'Battery Storage', icon: Zap, catalog: BATTERY_CATALOG, current: spacecraft.battery },
    { id: 'payload', name: 'Instruments', icon: Orbit, catalog: INSTRUMENT_CATALOG, current: spacecraft.instruments, isMulti: true },
    { id: 'comms', name: 'Communications', icon: Radio, catalog: COMMS_CATALOG, current: spacecraft.comms },
    { id: 'adcs', name: 'ADCS / Pointing', icon: Cpu, catalog: ADCS_CATALOG, current: spacecraft.adcs },
    { id: 'computing', name: 'Computing & SSR', icon: HardDrive, catalog: COMPUTING_CATALOG, current: spacecraft.computing },
    { id: 'thermal', name: 'Thermal Control', icon: Thermometer, catalog: THERMAL_CATALOG, current: spacecraft.thermal },
    { id: 'propulsion', name: 'Propulsion Thruster', icon: Flame, catalog: PROPULSION_CATALOG, current: spacecraft.propulsion },
  ];

  const currentCategoryData = categories.find(c => c.id === activeCategory);

  const handleSelectComponent = (comp) => {
    if (activeCategory === 'payload') {
      const list = spacecraft.instruments || [];
      const exists = list.some(i => i.id === comp.id);
      if (exists) {
        if (list.length > 1) {
          updateSpacecraft('instruments', list.filter(i => i.id !== comp.id));
        }
      } else {
        updateSpacecraft('instruments', [...list, comp]);
      }
    } else {
      updateSpacecraft(activeCategory, comp);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Cpu className="w-3.5 h-3.5" />
          <span>SPACECRAFT LABORATORY & SUBSYSTEM INTEGRATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Spacecraft Laboratory
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Modular subsystem configuration bench. Add, configure, and inspect individual hardware components
          and inspect live mass distributions, power draws, and telemetry rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subsystems Tabs & Catalog Grid */}
        <div className="lg:col-span-8 space-y-5">
          {/* Subsystem category buttons */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition border ${
                    isActive
                      ? 'border-orbit-cyan bg-orbit-cyan/15 text-orbit-cyan font-bold shadow-glow-cyan/40'
                      : 'border-space-border bg-space-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Component Catalog Cards */}
          <div className="space-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                {currentCategoryData?.name} Catalog
              </h3>
              {activeCategory === 'payload' && (
                <span className="text-xs font-mono text-emerald-400">
                  {spacecraft.instruments?.length || 0} Installed (Click to Add/Remove)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCategoryData?.catalog.map((item) => {
                const isSelected = activeCategory === 'payload'
                  ? (spacecraft.instruments || []).some(i => i.id === item.id)
                  : spacecraft[activeCategory]?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent(item)}
                    className={`p-4 rounded-lg cursor-pointer transition border-2 flex flex-col justify-between ${
                      isSelected
                        ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20'
                        : 'border-space-border bg-space-950/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.efficiency || item.frequencyBand || item.structuralMargin || item.pointingAccuracyDeg ? `±${item.pointingAccuracyDeg}°` : ''}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-orbit-cyan">
                            <Check className="w-3.5 h-3.5" /> ACTIVE
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">
                            {activeCategory === 'payload' ? '+ ADD' : 'SELECT'}
                          </span>
                        )}
                      </div>

                      <h4 className="font-mono font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-slate-300 leading-snug">{item.description}</p>

                      <div className="pt-2 border-t border-space-border/50 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-400">
                        <div>Mass: <span className="text-slate-200">{item.massKg} kg</span></div>
                        {item.generationW && <div>Power Gen: <span className="text-amber-400">{item.generationW} W</span></div>}
                        {item.powerConsumptionW && <div>Power Cons: <span className="text-amber-400">{item.powerConsumptionW} W</span></div>}
                        {item.capacityWh && <div>Capacity: <span className="text-orbit-cyan">{item.capacityWh} Wh</span></div>}
                        {item.dataRateMbps && <div>Data: <span className="text-purple-400">{item.dataRateMbps} Mbps</span></div>}
                        {item.storageCapacityGB && <div>Storage: <span className="text-purple-400">{item.storageCapacityGB} GB</span></div>}
                        {item.ispSeconds && <div>Isp: <span className="text-amber-400">{item.ispSeconds} s</span></div>}
                        <div>Cost: <span className="text-emerald-400">{formatCurrency(item.costUSD)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 3D Visualization & Mass Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-panel p-4 space-y-3">
            <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              3D Spacecraft Inspection
            </h3>
            <CanvasErrorBoundary>
              <SpacecraftViewer3D spacecraft={spacecraft} highlightedCategory={activeCategory} />
            </CanvasErrorBoundary>
          </div>

          {/* Mass Distribution Breakdown */}
          <div className="space-panel p-4 space-y-3">
            <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              Subsystem Mass Breakdown
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              {(metrics?.mass?.breakdown || []).map((row, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 truncate max-w-[170px]">{row.name}:</span>
                  <span className="font-bold text-slate-200">{row.massKg.toFixed(1)} kg</span>
                </div>
              ))}
              <div className="pt-2 border-t border-space-border flex justify-between font-bold text-orbit-cyan">
                <span>TOTAL WET LAUNCH MASS:</span>
                <span>{formatMass(metrics?.mass?.totalLaunchMass || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
