import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Layers, 
  Orbit, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  GraduationCap,
  Sparkles 
} from 'lucide-react';
import { useMission } from '../../state/MissionContext.jsx';
import { useTheme } from '../../state/ThemeContext.jsx';
import { MISSION_CAMPAIGNS } from '../../data/missions.js';

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'PHASE 01 // OBJECTIVES',
    title: 'Select a Planetary Campaign',
    icon: Rocket,
    description:
      'Choose from real-world scientific scenarios including Earth Climate Observation (Sentinel-Terra), Lunar Polar Water Ice Mapping (Artemis Scout), or Martian Geology (Ares Pioneer). Each scenario establishes rigorous scientific payload requirements, orbital destinations, and budget caps.',
    tips: 'Tip: Beginners should start with Earth Low Orbit where solar power is abundant and communication passes occur every 90 minutes.',
  },
  {
    step: 2,
    badge: 'PHASE 02 // SYSTEMS ENGINEERING',
    title: 'Balance the 6 Physical Pillars',
    icon: Layers,
    description:
      'A spacecraft is a coupled physical system. Adding high-resolution radar increases science data, but demands massive battery storage and heavier solar arrays. Balance Mass (kg), Daylight/Eclipse Power (W), Budget ($), Storage (GB), Downlink (Mbps), and Lifetime (Days).',
    tips: 'Watch your Power Margin: Ensure battery capacity can survive the 35-minute orbital shadow during planetary eclipse.',
  },
  {
    step: 3,
    badge: 'PHASE 03 // ASTRODYNAMICS',
    title: 'Orbit Mechanics & Launch Procurement',
    icon: Orbit,
    description:
      'Select a certified commercial launch vehicle (Electron, Falcon 9, Atlas V, Ariane 64, Falcon Heavy). Calculate Tsiolkovsky delta-V budgets to guarantee your propulsion system can circularize and maintain your desired Keplerian orbit altitude.',
    tips: 'Higher inclination orbits provide full planetary coverage but require higher delta-V injection burns.',
  },
  {
    step: 4,
    badge: 'PHASE 04 // FLIGHT OPS',
    title: 'Execute Live Flight Operations',
    icon: Activity,
    description:
      'Take the console in Mission Control. Watch your spacecraft trace real-time 3D orbits around Earth, the Moon, or Mars. Monitor power generation, thermal radiators, eclipse cycles, and telemetry downlinks during ground station Acquisition of Signal (AOS).',
    tips: 'Achieve 85+ score points across objectives, budget reserve, and reliability to earn NASA-standard Flight Certification.',
  },
];

export default function FlightAcademyTour({ isOpen, onClose }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const { loadCampaign, setActiveTab } = useMission();
  const { playUiSound } = useTheme();

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStepIdx];
  const Icon = current.icon;
  const isLast = currentStepIdx === TOUR_STEPS.length - 1;

  const handleNext = () => {
    playUiSound('click');
    if (!isLast) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    playUiSound('click');
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    playUiSound('beep');
    try {
      localStorage.setItem('astraject_tour_completed', 'true');
    } catch {}
    // Load Sentinel-Terra as starting mission
    loadCampaign(MISSION_CAMPAIGNS[0]);
    setActiveTab('designer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl rounded-2xl bg-space-900 border border-orbit-cyan/40 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden hud-corner"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orbit-cyan to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-space-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orbit-cyan/15 border border-orbit-cyan/30 flex items-center justify-center text-orbit-cyan">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-orbit-cyan font-bold block">
                ASTRAJECT FLIGHT ACADEMY
              </span>
              <h3 className="text-base font-bold text-white font-mono">
                Mission Architect Orientation
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              playUiSound('click');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-space-850 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-between gap-2">
          {TOUR_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStepIdx
                  ? 'bg-orbit-cyan shadow-glow-cyan'
                  : idx < currentStepIdx
                  ? 'bg-orbit-cyan/50'
                  : 'bg-space-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-space-850 border border-space-border flex items-center justify-center text-orbit-cyan shrink-0 shadow-glow-cyan">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-orbit-cyan font-bold block">
                  {current.badge}
                </span>
                <h4 className="text-lg font-bold text-white font-mono">
                  {current.title}
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {current.description}
            </p>

            <div className="p-3 rounded-lg bg-space-950/80 border border-space-border/80 flex items-start gap-2.5 text-xs font-mono text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{current.tips}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-space-border">
          <button
            onClick={() => {
              playUiSound('click');
              onClose();
            }}
            className="text-xs font-mono text-slate-500 hover:text-slate-300 transition"
          >
            Skip Orientation
          </button>

          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-space-850 hover:bg-space-800 border border-space-border text-xs font-mono text-slate-300 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orbit-cyan text-space-950 font-mono font-bold text-xs hover:opacity-90 transition shadow-glow-cyan"
            >
              <span>{isLast ? 'Begin Mission Design' : 'Next Stage'}</span>
              {isLast ? (
                <CheckCircle2 className="w-4 h-4 ml-0.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

