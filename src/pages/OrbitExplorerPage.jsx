import React, { useState, useMemo } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { calculateCircularOrbit, calculateHohmannTransfer } from '../engine/calculations/orbitalMechanics.js';
import SpaceVisualization3D from '../components/visualization/SpaceVisualization3D.jsx';
import { 
  Orbit, 
  RotateCw, 
  Sliders, 
  Gauge, 
  Clock, 
  Zap, 
  Compass, 
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { formatVelocity, formatDistance } from '../utils/formatters.js';

export default function OrbitExplorerPage() {
  const { currentMission, updateOrbit } = useMission();

  const [bodyId, setBodyId] = useState(currentMission?.destination || 'earth');
  const [altitudeKm, setAltitudeKm] = useState(currentMission?.orbit?.altitudeKm || 705);
  const [inclinationDeg, setInclinationDeg] = useState(currentMission?.orbit?.inclinationDeg || 98.2);

  // Hohmann Transfer Calculator States
  const [targetAltKm, setTargetAltKm] = useState(35786); // GEO default

  // Live calculations
  const orbitMetrics = useMemo(() => {
    try {
      return calculateCircularOrbit(bodyId, altitudeKm, inclinationDeg);
    } catch {
      return null;
    }
  }, [bodyId, altitudeKm, inclinationDeg]);

  const hohmannMetrics = useMemo(() => {
    try {
      return calculateHohmannTransfer(bodyId, altitudeKm, targetAltKm);
    } catch {
      return null;
    }
  }, [bodyId, altitudeKm, targetAltKm]);

  const handleApplyToMission = () => {
    updateOrbit({
      id: `orbit-custom-${altitudeKm}-${inclinationDeg}`,
      name: `Custom Circular Orbit (${altitudeKm} km, ${inclinationDeg}°)`,
      centralBody: bodyId,
      altitudeKm,
      inclinationDeg,
      eccentricity: 0,
      orbitType: 'Circular Keplerian',
      description: `Custom circular trajectory at ${altitudeKm} km altitude with ${inclinationDeg}° orbital inclination.`,
      advantages: ['Customized coverage parameters'],
      tradeoffs: ['Requires user-specified mission optimization'],
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <Orbit className="w-3.5 h-3.5" />
          <span>ASTRODYNAMICS & ORBITAL MECHANICS LABORATORY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Orbit Explorer
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Simulate Keplerian two-body mechanics. Adjust altitude and inclination to inspect orbital velocities,
          ground coverage rates, eclipse shadows, and calculate Hohmann transfer delta-V requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Visualization */}
        <div className="lg:col-span-7 h-[460px] rounded-xl overflow-hidden border border-space-border shadow-2xl relative">
          <SpaceVisualization3D
            bodyId={bodyId}
            altitudeKm={altitudeKm}
            inclinationDeg={inclinationDeg}
            orbitAngleRad={0.8}
            isInEclipse={orbitMetrics?.maxEclipseFraction > 0.3}
            isContacting={true}
            subSatelliteCoords={{ latitude: inclinationDeg * 0.5, longitude: 45 }}
          />
        </div>

        {/* Right: Orbit Parameter Controls & Live Readouts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-panel p-5 space-y-4">
            <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orbit-cyan" />
              Orbital Parameters Control
            </h3>

            {/* Central Body Selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">CENTRAL CELESTIAL BODY</label>
              <select
                value={bodyId}
                onChange={(e) => setBodyId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-space-950 border border-space-border text-xs font-mono text-white focus:border-orbit-cyan focus:outline-none"
              >
                <option value="earth">Earth (Radius: 6,371 km)</option>
                <option value="moon">The Moon (Radius: 1,737 km)</option>
                <option value="mars">Mars (Radius: 3,389 km)</option>
                <option value="asteroid">Asteroid 16 Psyche (Radius: 110 km)</option>
              </select>
            </div>

            {/* Altitude Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">ALTITUDE ABOVE SURFACE:</span>
                <span className="text-orbit-cyan font-bold">{altitudeKm.toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min="150"
                max={bodyId === 'earth' ? '36000' : '5000'}
                step="25"
                value={altitudeKm}
                onChange={(e) => setAltitudeKm(Number(e.target.value))}
                className="w-full accent-orbit-cyan cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>150 km (LEO limit)</span>
                <span>{bodyId === 'earth' ? '35,786 km (GEO)' : '5,000 km'}</span>
              </div>
            </div>

            {/* Inclination Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">INCLINATION:</span>
                <span className="text-orbit-cyan font-bold">{inclinationDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="0.5"
                value={inclinationDeg}
                onChange={(e) => setInclinationDeg(Number(e.target.value))}
                className="w-full accent-orbit-cyan cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>0° (Equatorial)</span>
                <span>90° (Polar)</span>
                <span>98° (Sun-Sync)</span>
                <span>180° (Retrograde)</span>
              </div>
            </div>

            {/* Live Astrodynamic Readouts */}
            <div className="pt-3 border-t border-space-border/60 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">ORBITAL VELOCITY</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatVelocity(orbitMetrics?.velocityMs || 0)}
                </span>
              </div>

              <div className="p-2.5 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">ORBITAL PERIOD</span>
                <span className="text-blue-400 font-bold text-sm">
                  {orbitMetrics?.periodMinutes?.toFixed(1) || 0} min
                </span>
              </div>

              <div className="p-2.5 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">MAX ECLIPSE SHADOW</span>
                <span className="text-amber-400 font-bold text-sm">
                  {(orbitMetrics?.maxEclipseDurationSeconds / 60)?.toFixed(1) || 0} min
                </span>
              </div>

              <div className="p-2.5 rounded bg-space-950/70 border border-space-border">
                <span className="text-[10px] text-slate-500 block">REVOLUTIONS / DAY</span>
                <span className="text-purple-400 font-bold text-sm">
                  {orbitMetrics?.orbitsPerDay?.toFixed(1) || 0} orbits
                </span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyToMission}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-orbit-cyan text-space-950 font-mono text-xs font-bold hover:bg-sky-300 transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply Orbit to Active Mission</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hohmann Transfer Delta-V Calculator */}
      <div className="space-panel p-6 space-y-4">
        <div>
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Hohmann Orbital Transfer Calculator (Delta-V Budget)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Calculates the two impulse burns required to transition between coplanar circular orbits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">INITIAL ALTITUDE</label>
            <div className="px-3 py-2 rounded bg-space-950 border border-space-border font-mono text-xs text-white">
              {altitudeKm.toLocaleString()} km
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">TARGET ALTITUDE</label>
            <input
              type="number"
              min="200"
              max="50000"
              value={targetAltKm}
              onChange={(e) => setTargetAltKm(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-space-950 border border-space-border font-mono text-xs text-white focus:border-orbit-cyan focus:outline-none"
            />
          </div>

          <div className="p-3 rounded bg-space-950/80 border border-space-border font-mono text-xs space-y-1">
            <span className="text-[10px] text-slate-500 block">TOTAL DELTA-V NEEDED</span>
            <span className="text-amber-400 font-bold text-sm">
              {hohmannMetrics?.totalDeltaVKms?.toFixed(3) || 0} km/s
            </span>
            <div className="text-[10px] text-slate-400">
              ΔV₁: {hohmannMetrics?.deltaV1?.toFixed(0)} m/s | ΔV₂: {hohmannMetrics?.deltaV2?.toFixed(0)} m/s
            </div>
          </div>

          <div className="p-3 rounded bg-space-950/80 border border-space-border font-mono text-xs space-y-1">
            <span className="text-[10px] text-slate-500 block">TRANSFER TIME</span>
            <span className="text-blue-400 font-bold text-sm">
              {hohmannMetrics?.transferTimeHours > 24 
                ? `${hohmannMetrics?.transferTimeDays?.toFixed(2)} days`
                : `${hohmannMetrics?.transferTimeHours?.toFixed(2)} hours`}
            </span>
            <div className="text-[10px] text-slate-400">Half-orbit transfer duration</div>
          </div>
        </div>
      </div>
    </div>
  );
}
