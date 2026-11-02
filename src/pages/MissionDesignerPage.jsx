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
import { LAUNCH_VEHICLES } from '../data/launchVehicles.js';
import { ORBIT_CATALOG } from '../data/orbits.js';
import ValidationAlerts from '../components/common/ValidationAlerts.jsx';
import SpacecraftViewer3D from '../components/visualization/SpacecraftViewer3D.jsx';
import { 
  Sliders, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Rocket, 
  Cpu, 
  Orbit, 
  Zap, 
  Radio, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  Play,
  Plus,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatMass, formatPower } from '../utils/formatters.js';

const WIZARD_STEPS = [
  { id: 1, name: 'Mission Objectives', icon: Sliders },
  { id: 2, name: 'Bus & Structure', icon: Cpu },
  { id: 3, name: 'Scientific Payload', icon: Orbit },
  { id: 4, name: 'Power & Storage', icon: Zap },
  { id: 5, name: 'Comms & ADCS', icon: Radio },
  { id: 6, name: 'Target Orbit', icon: Orbit },
  { id: 7, name: 'Launch Vehicle', icon: Rocket },
  { id: 8, name: 'Review & Launch', icon: ShieldCheck },
];

export default function MissionDesignerPage() {
  const { 
    currentMission, 
    updateSpacecraft, 
    updateOrbit, 
    updateLaunchVehicle, 
    updateMissionParameters,
    validationResults, 
    saveCurrentMission, 
    setActiveTab, 
    startSimulation 
  } = useMission();

  const [currentStep, setCurrentStep] = useState(1);
  const [saveToast, setSaveToast] = useState(false);

  const spacecraft = currentMission?.spacecraft || {};
  const { metrics, errors, warnings, isValid } = validationResults || { errors: [], warnings: [], isValid: false };

  const handleToggleInstrument = (inst) => {
    const currentList = spacecraft.instruments || [];
    const exists = currentList.some(i => i.id === inst.id);
    if (exists) {
      if (currentList.length <= 1) return; // Keep at least 1 instrument
      updateSpacecraft('instruments', currentList.filter(i => i.id !== inst.id));
    } else {
      updateSpacecraft('instruments', [...currentList, inst]);
    }
  };

  const handleSave = () => {
    saveCurrentMission();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleProceedToSim = () => {
    if (!isValid) return;
    saveCurrentMission();
    startSimulation();
    setActiveTab('control');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Wizard Step Progression Bar */}
      <div className="space-panel p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg text-xs font-mono transition border ${
                  isCurrent
                    ? 'border-orbit-cyan bg-orbit-cyan/15 text-orbit-cyan font-bold shadow-glow-cyan/50'
                    : isCompleted
                    ? 'border-space-border/60 bg-space-900/60 text-slate-300 hover:border-slate-500'
                    : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isCurrent ? 'bg-orbit-cyan text-space-950' : isCompleted ? 'bg-emerald-500/30 text-emerald-300' : 'bg-space-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                  </span>
                  <Icon className="w-4 h-4 hidden sm:inline" />
                </div>
                <span className="text-[11px] truncate max-w-[90px]">{step.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step Configuration Controls */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Mission Objectives */}
          {currentStep === 1 && (
            <div className="space-panel p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 1: Mission Objectives & Parameters</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Define mission identity, target destination body, lifetime, and scientific goals.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">MISSION NAME</label>
                  <input
                    type="text"
                    value={currentMission?.title || ''}
                    onChange={(e) => updateMissionParameters({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-space-950 border border-space-border text-sm font-mono text-white focus:border-orbit-cyan focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">TARGET DESTINATION</label>
                    <select
                      value={currentMission?.destination || 'earth'}
                      onChange={(e) => updateMissionParameters({ destination: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-space-950 border border-space-border text-sm font-mono text-white focus:border-orbit-cyan focus:outline-none"
                    >
                      <option value="earth">Earth (LEO / SSO / GEO)</option>
                      <option value="moon">The Moon (Lunar Orbit / Polar)</option>
                      <option value="mars">Mars (Science Orbit)</option>
                      <option value="asteroid">Asteroid 16 Psyche</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 block mb-1">MISSION DURATION (DAYS)</label>
                    <input
                      type="number"
                      min="30"
                      max="1200"
                      value={currentMission?.durationDays || 90}
                      onChange={(e) => updateMissionParameters({ durationDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded bg-space-950 border border-space-border text-sm font-mono text-white focus:border-orbit-cyan focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">PLANNED SCIENTIFIC OBJECTIVES</label>
                  <div className="space-y-2">
                    {(currentMission?.objectives || []).map((obj) => (
                      <div key={obj.id} className="p-3 rounded bg-space-950/60 border border-space-border text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-200">{obj.title}</span>
                          <p className="text-slate-400 text-[11px] mt-0.5">{obj.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${obj.isPrimary ? 'bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30' : 'bg-space-900 text-slate-400'}`}>
                          {obj.isPrimary ? 'PRIMARY' : 'SECONDARY'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Bus & Structure */}
          {currentStep === 2 && (
            <div className="space-panel p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 2: Spacecraft Bus & Structural Frame</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The primary chassis dictates dry mass, volume envelope, and maximum payload mounting limit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BUS_CATALOG.map((bus) => {
                  const isSelected = spacecraft.bus?.id === bus.id;
                  return (
                    <div
                      key={bus.id}
                      onClick={() => updateSpacecraft('bus', bus)}
                      className={`p-4 rounded-lg cursor-pointer transition border-2 flex flex-col justify-between ${
                        isSelected
                          ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/30'
                          : 'border-space-border bg-space-950/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{bus.structuralMargin} Margin</span>
                          {isSelected && <Check className="w-4 h-4 text-orbit-cyan" />}
                        </div>
                        <h4 className="font-mono font-bold text-sm text-white">{bus.name}</h4>
                        <p className="text-xs text-slate-300">{bus.description}</p>
                        <div className="pt-2 border-t border-space-border/50 text-[11px] font-mono text-slate-400 space-y-1">
                          <div>Mass: <span className="text-slate-200 font-bold">{bus.massKg} kg</span></div>
                          <div>Max Payload: <span className="text-slate-200 font-bold">{bus.maxPayloadMassKg} kg</span></div>
                          <div>Cost: <span className="text-emerald-400 font-bold">{formatCurrency(bus.costUSD)}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Scientific Payload Array */}
          {currentStep === 3 && (
            <div className="space-panel p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-mono text-white">STEP 3: Scientific Payloads & Instruments</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select scientific instruments matching your mission objectives. Toggle one or more sensors.
                  </p>
                </div>
                <div className="text-xs font-mono text-orbit-cyan">
                  {spacecraft.instruments?.length || 0} Installed
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INSTRUMENT_CATALOG.map((inst) => {
                  const isInstalled = (spacecraft.instruments || []).some(i => i.id === inst.id);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleToggleInstrument(inst)}
                      className={`p-4 rounded-lg cursor-pointer transition border-2 flex flex-col justify-between ${
                        isInstalled
                          ? 'border-emerald-500 bg-space-850 shadow-glow-emerald/20'
                          : 'border-space-border bg-space-950/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            +{inst.scienceValue} Science Value
                          </span>
                          <span className={`text-xs font-mono font-bold ${isInstalled ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isInstalled ? 'INSTALLED' : '+ CLICK TO ADD'}
                          </span>
                        </div>
                        <h4 className="font-mono font-bold text-sm text-white">{inst.name}</h4>
                        <p className="text-xs text-slate-300">{inst.measurementType}</p>
                        <p className="text-[11px] text-slate-400 leading-snug">{inst.description}</p>
                        <div className="pt-2 border-t border-space-border/50 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-400">
                          <div>Mass: <span className="text-slate-200">{inst.massKg} kg</span></div>
                          <div>Power: <span className="text-amber-400">{inst.powerConsumptionW} W</span></div>
                          <div>Data: <span className="text-purple-400">{inst.dataRateMbps} Mbps</span></div>
                          <div>Cost: <span className="text-emerald-400">{formatCurrency(inst.costUSD)}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Power System & Battery */}
          {currentStep === 4 && (
            <div className="space-panel p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 4: Electrical Power & Energy Storage</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Balance solar generation and battery reserve against day/night eclipse periods.
                </p>
              </div>

              {/* Power Generation Source */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  A. Power Generation Technology
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {POWER_CATALOG.map((pwr) => {
                    const isSelected = spacecraft.power?.id === pwr.id;
                    return (
                      <div
                        key={pwr.id}
                        onClick={() => updateSpacecraft('power', pwr)}
                        className={`p-3.5 rounded-lg cursor-pointer transition border-2 ${
                          isSelected
                            ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20'
                            : 'border-space-border bg-space-950/60 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-400">{pwr.generationW} W</span>
                          {isSelected && <Check className="w-4 h-4 text-orbit-cyan" />}
                        </div>
                        <h5 className="font-mono font-bold text-xs text-white mt-1">{pwr.name}</h5>
                        <p className="text-[11px] text-slate-400 mt-1">{pwr.description}</p>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 pt-1 border-t border-space-border/50">
                          <span>Mass: {pwr.massKg} kg</span>
                          <span className="text-emerald-400">{formatCurrency(pwr.costUSD)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Energy Storage (Battery) */}
              <div className="space-y-3 pt-2 border-t border-space-border">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  B. Secondary Energy Storage (Battery)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BATTERY_CATALOG.map((bat) => {
                    const isSelected = spacecraft.battery?.id === bat.id;
                    return (
                      <div
                        key={bat.id}
                        onClick={() => updateSpacecraft('battery', bat)}
                        className={`p-3 rounded-lg cursor-pointer transition border-2 ${
                          isSelected
                            ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20'
                            : 'border-space-border bg-space-950/60 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-orbit-cyan">{bat.capacityWh} Wh</span>
                          {isSelected && <Check className="w-4 h-4 text-orbit-cyan" />}
                        </div>
                        <h5 className="font-mono font-bold text-xs text-white mt-1">{bat.name}</h5>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 pt-1 border-t border-space-border/50">
                          <span>Mass: {bat.massKg} kg</span>
                          <span className="text-emerald-400">{formatCurrency(bat.costUSD)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Communications & ADCS */}
          {currentStep === 5 && (
            <div className="space-panel p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 5: Communications, ADCS & Avionics</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure sufficient bandwidth for downlink and precise pointing for scientific observation.
                </p>
              </div>

              {/* Communications */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  A. Communications Transceiver & Antenna
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COMMS_CATALOG.map((comms) => {
                    const isSelected = spacecraft.comms?.id === comms.id;
                    return (
                      <div
                        key={comms.id}
                        onClick={() => updateSpacecraft('comms', comms)}
                        className={`p-3 rounded-lg cursor-pointer transition border-2 ${
                          isSelected ? 'border-orbit-cyan bg-space-850' : 'border-space-border bg-space-950/60 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-purple-400">{comms.bandwidthMbps} Mbps</span>
                          {isSelected && <Check className="w-4 h-4 text-orbit-cyan" />}
                        </div>
                        <h5 className="font-mono font-bold text-xs text-white mt-1">{comms.name}</h5>
                        <p className="text-[11px] text-slate-400 mt-1">{comms.description}</p>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 pt-1 border-t border-space-border/50">
                          <span>Mass: {comms.massKg} kg</span>
                          <span className="text-emerald-400">{formatCurrency(comms.costUSD)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADCS */}
              <div className="space-y-3 pt-2 border-t border-space-border">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  B. Attitude Determination & Control System (ADCS)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ADCS_CATALOG.map((adcs) => {
                    const isSelected = spacecraft.adcs?.id === adcs.id;
                    return (
                      <div
                        key={adcs.id}
                        onClick={() => updateSpacecraft('adcs', adcs)}
                        className={`p-3 rounded-lg cursor-pointer transition border-2 ${
                          isSelected ? 'border-orbit-cyan bg-space-850' : 'border-space-border bg-space-950/60 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-orbit-cyan">±{adcs.pointingAccuracyDeg}° Pointing</span>
                          {isSelected && <Check className="w-4 h-4 text-orbit-cyan" />}
                        </div>
                        <h5 className="font-mono font-bold text-xs text-white mt-1">{adcs.name}</h5>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 pt-1 border-t border-space-border/50">
                          <span>Mass: {adcs.massKg} kg</span>
                          <span className="text-emerald-400">{formatCurrency(adcs.costUSD)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Target Orbit */}
          {currentStep === 6 && (
            <div className="space-panel p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 6: Orbital Regime Selection</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the orbital altitude, inclination, and ground revisit geometry.
                </p>
              </div>

              <div className="space-y-3">
                {ORBIT_CATALOG.filter(o => o.centralBody === (currentMission?.destination || 'earth')).map((orb) => {
                  const isSelected = currentMission?.orbit?.id === orb.id;
                  return (
                    <div
                      key={orb.id}
                      onClick={() => updateOrbit(orb)}
                      className={`p-4 rounded-lg cursor-pointer transition border-2 ${
                        isSelected ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20' : 'border-space-border bg-space-950/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Orbit className="w-4 h-4 text-orbit-cyan" />
                          <h4 className="font-mono font-bold text-sm text-white">{orb.name}</h4>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          {orb.altitudeKm} km | {orb.inclinationDeg}° Inc
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{orb.description}</p>
                      <div className="mt-2 text-xs font-mono text-slate-400">
                        <span className="text-orbit-cyan">Advantage:</span> {orb.advantages[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: Launch Vehicle */}
          {currentStep === 7 && (
            <div className="space-panel p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 7: Launch Vehicle Selection</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select a certified booster with sufficient payload lift capacity to destination.
                </p>
              </div>

              <div className="space-y-3">
                {LAUNCH_VEHICLES.map((lv) => {
                  const isSelected = currentMission?.launchVehicle?.id === lv.id;
                  const destCap = lv.maxPayloadMassByDestination?.[currentMission?.destination || 'earth'] || 0;
                  const canReach = destCap > 0;

                  return (
                    <div
                      key={lv.id}
                      onClick={() => canReach && updateLaunchVehicle(lv)}
                      className={`p-4 rounded-lg transition border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        !canReach ? 'opacity-40 cursor-not-allowed border-space-border bg-space-950/40' :
                        isSelected ? 'border-orbit-cyan bg-space-850 shadow-glow-cyan/20 cursor-pointer' :
                        'border-space-border bg-space-950/60 hover:border-slate-500 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-orbit-cyan" />
                          <h4 className="font-mono font-bold text-sm text-white">{lv.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-slate-300">
                            {lv.manufacturer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{lv.description}</p>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs shrink-0">
                        <div>
                          <span className="text-slate-500 block text-[10px]">LIFT TO DEST</span>
                          <span className="font-bold text-slate-200">
                            {canReach ? `${destCap.toLocaleString()} kg` : 'INCOMPATIBLE'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">LAUNCH COST</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(lv.launchCostUSD)}</span>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-orbit-cyan" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 8: Review & Launch Validation */}
          {currentStep === 8 && (
            <div className="space-panel p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold font-mono text-white">STEP 8: Pre-Flight Feasibility Review</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Physical validation results. All blocking errors must be resolved prior to launch.
                </p>
              </div>

              <ValidationAlerts errors={errors} warnings={warnings} />

              {isValid ? (
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>MISSION FEASIBILITY VERIFIED: READY FOR LAUNCH</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your spacecraft design meets all structural mass margins, daylight power generation,
                    orbital eclipse storage, telemetry downlinks, and financial budget caps.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleProceedToSim}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-space-950 font-mono font-bold text-sm transition shadow-glow-emerald"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Proceed to Launch Simulation</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-500/40 text-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>FLIGHT CLEARANCE DENIED</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Resolve the {errors.length} blocking engineering errors listed above before the mission can proceed to launch.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-space-900 border border-space-border text-xs font-mono text-slate-300 hover:text-white"
              >
                <Save className="w-3.5 h-3.5 text-orbit-cyan" />
                <span>{saveToast ? 'Saved!' : 'Save Draft'}</span>
              </button>

              <button
                onClick={() => setCurrentStep(prev => Math.min(8, prev + 1))}
                disabled={currentStep === 8}
                className="flex items-center gap-2 px-5 py-2 rounded bg-orbit-cyan text-space-950 text-xs font-mono font-bold hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live 3D Spacecraft & Specifications Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Spacecraft Assembly
              </span>
              <span className="text-[10px] font-mono text-orbit-cyan">
                {formatMass(metrics?.mass?.totalLaunchMass || 0)}
              </span>
            </div>

            <SpacecraftViewer3D
              spacecraft={spacecraft}
              highlightedCategory={
                currentStep === 2 ? 'bus' :
                currentStep === 3 ? 'payload' :
                currentStep === 4 ? 'power' :
                currentStep === 5 ? 'comms' : null
              }
            />

            {/* Quick Live Spec Table */}
            <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-space-border/60">
              <div className="flex justify-between text-slate-400">
                <span>Total Wet Mass:</span>
                <span className="text-slate-200 font-bold">{formatMass(metrics?.mass?.totalLaunchMass || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Daylight Power:</span>
                <span className="text-amber-400 font-bold">{formatPower(metrics?.power?.daylightGenerationW || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Eclipse DoD:</span>
                <span className={`${(metrics?.power?.dodReached || 0) > 0.7 ? 'text-crimson' : 'text-slate-200'} font-bold`}>
                  {metrics?.power?.dodPercent?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Lifecycle Cost:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(metrics?.budget?.totalCost || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Downlink Rate:</span>
                <span className="text-purple-400 font-bold">{metrics?.comms?.effectiveDownlinkRateMbps?.toFixed(1) || 0} Mbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
