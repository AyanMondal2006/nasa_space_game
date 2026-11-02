import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MISSION_CAMPAIGNS } from '../data/missions.js';
import { BUS_CATALOG, POWER_CATALOG, BATTERY_CATALOG, INSTRUMENT_CATALOG, COMMS_CATALOG, ADCS_CATALOG, COMPUTING_CATALOG, THERMAL_CATALOG, PROPULSION_CATALOG } from '../data/spacecraftComponents.js';
import { LAUNCH_VEHICLES } from '../data/launchVehicles.js';
import { ORBIT_CATALOG } from '../data/orbits.js';
import { validateMission } from '../engine/validation/validateMission.js';
import { SimulationEngine, SIMULATION_PHASES } from '../engine/simulation/simulationEngine.js';
import { persistenceService } from '../services/persistenceService.js';
import { exportService } from '../services/exportService.js';

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  // Navigation Section
  const [activeTab, setActiveTab] = useState('home');

  // Local Team Collaborative Role
  const [teamRole, setTeamRole] = useState('Mission Planner'); // 'Mission Planner' | 'Spacecraft Engineer' | 'Payload Scientist' | 'Flight Operations Engineer'

  // Saved Missions
  const [savedMissions, setSavedMissions] = useState(() => persistenceService.getSavedMissions());

  // Recent Mission Outcome Reports
  const [completedReports, setCompletedReports] = useState(() => {
    try {
      const raw = localStorage.getItem('astraject_v1_reports') || localStorage.getItem('orbitforge_v1_reports');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Active Mission Draft
  const [currentMission, setCurrentMission] = useState(() => {
    const savedActive = persistenceService.getActiveMission();
    if (savedActive) return savedActive;

    // Default to Campaign 1 (Earth Observation)
    const initialCampaign = MISSION_CAMPAIGNS[0];
    return assembleMissionFromConfig(initialCampaign, initialCampaign.defaultConfiguration);
  });

  // Real-time Mission Validation Engine
  const validationResults = useMemo(() => {
    return validateMission(currentMission);
  }, [currentMission]);

  // Simulation Engine Instance
  const simEngineRef = useRef(null);
  const [simState, setSimState] = useState(null);
  const [isSimRunning, setIsSimRunning] = useState(false);

  // Initialize or re-create simulation engine when mission changes
  const initSimulation = useCallback(() => {
    if (!currentMission) return;
    const sim = new SimulationEngine(currentMission, currentMission.simulationSeed || 42);
    simEngineRef.current = sim;
    setSimState({ ...sim.state });
    setIsSimRunning(false);
  }, [currentMission]);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  // Real-time Simulation Tick Loop
  useEffect(() => {
    let timerId;
    if (isSimRunning && simEngineRef.current) {
      timerId = setInterval(() => {
        const engine = simEngineRef.current;
        if (!engine || engine.state.isPaused) return;

        const nextState = engine.step(60); // 60 simulated seconds per tick
        setSimState({ ...nextState });

        // If completed or failed, save to reports
        if (nextState.status === SIMULATION_PHASES.COMPLETED || nextState.status === SIMULATION_PHASES.FAILED) {
          setIsSimRunning(false);
          if (nextState.score) {
            saveCompletedReport(currentMission, nextState);
          }
        }
      }, 250); // updates 4 times per real second
    }

    return () => clearInterval(timerId);
  }, [isSimRunning, currentMission]);

  const saveCompletedReport = (mission, finalSimState) => {
    const report = {
      id: `report-${Date.now()}`,
      missionId: mission.id,
      missionTitle: mission.title,
      scenarioId: mission.scenarioId,
      destination: mission.destination,
      completedAt: new Date().toISOString(),
      status: finalSimState.status,
      score: finalSimState.score,
      telemetryHistory: finalSimState.telemetryHistory,
      events: finalSimState.events,
      totalCollectedGB: (finalSimState.totalDataCollectedMB / 1024).toFixed(2),
      totalDownlinkedGB: (finalSimState.totalDataDownlinkedMB / 1024).toFixed(2),
      finalMET: finalSimState.missionTimeSeconds,
    };

    setCompletedReports(prev => {
      const updated = [report, ...prev].slice(0, 20);
      try {
        localStorage.setItem('astraject_v1_reports', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save report:', err);
      }
      return updated;
    });
  };

  // Simulation Controls
  const startSimulation = () => {
    if (!simEngineRef.current) initSimulation();
    simEngineRef.current.start();
    setIsSimRunning(true);
    setSimState({ ...simEngineRef.current.state });
  };

  const pauseSimulation = () => {
    if (!simEngineRef.current) return;
    simEngineRef.current.pause();
    setIsSimRunning(false);
    setSimState({ ...simEngineRef.current.state });
  };

  const resumeSimulation = () => {
    if (!simEngineRef.current) return;
    simEngineRef.current.resume();
    setIsSimRunning(true);
    setSimState({ ...simEngineRef.current.state });
  };

  const setSimulationSpeed = (multiplier) => {
    if (!simEngineRef.current) return;
    simEngineRef.current.setSpeed(multiplier);
    setSimState({ ...simEngineRef.current.state });
  };

  const restartSimulation = () => {
    initSimulation();
  };

  // Spacecraft & Mission Mutations
  const updateSpacecraft = (subsystemKey, componentOrArray) => {
    setCurrentMission(prev => {
      const next = {
        ...prev,
        spacecraft: {
          ...prev.spacecraft,
          [subsystemKey]: componentOrArray,
        },
      };
      persistenceService.setActiveMission(next);
      return next;
    });
  };

  const updateOrbit = (orbit) => {
    setCurrentMission(prev => {
      const next = {
        ...prev,
        orbit,
        targetOrbitId: orbit?.id,
      };
      persistenceService.setActiveMission(next);
      return next;
    });
  };

  const updateLaunchVehicle = (launchVehicle) => {
    setCurrentMission(prev => {
      const next = {
        ...prev,
        launchVehicle,
        launchVehicleId: launchVehicle?.id,
      };
      persistenceService.setActiveMission(next);
      return next;
    });
  };

  const updateMissionParameters = (params) => {
    setCurrentMission(prev => {
      const next = {
        ...prev,
        ...params,
      };
      persistenceService.setActiveMission(next);
      return next;
    });
  };

  // Load a Campaign
  const loadCampaign = (campaignId) => {
    const campaign = MISSION_CAMPAIGNS.find(c => c.id === campaignId) || MISSION_CAMPAIGNS[0];
    const newMission = assembleMissionFromConfig(campaign, campaign.defaultConfiguration);
    setCurrentMission(newMission);
    persistenceService.setActiveMission(newMission);
    setActiveTab('designer');
  };

  // Mission Save / Delete / Duplicate
  const saveCurrentMission = () => {
    if (!currentMission) return;
    persistenceService.saveMission(currentMission);
    setSavedMissions(persistenceService.getSavedMissions());
  };

  const deleteSavedMission = (missionId) => {
    persistenceService.deleteMission(missionId);
    setSavedMissions(persistenceService.getSavedMissions());
  };

  const duplicateSavedMission = (missionId) => {
    const dup = persistenceService.duplicateMission(missionId);
    if (dup) {
      setSavedMissions(persistenceService.getSavedMissions());
    }
    return dup;
  };

  const loadSavedMission = (mission) => {
    setCurrentMission(mission);
    persistenceService.setActiveMission(mission);
    setActiveTab('designer');
  };

  // Export & Import
  const exportCurrentMission = () => {
    exportService.exportMissionJSON(currentMission);
  };

  const importMissionJSON = (jsonString) => {
    const result = exportService.validateImportedJSON(jsonString);
    if (result.isValid) {
      setCurrentMission(result.mission);
      persistenceService.setActiveMission(result.mission);
      persistenceService.saveMission(result.mission);
      setSavedMissions(persistenceService.getSavedMissions());
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  return (
    <MissionContext.Provider
      value={{
        activeTab,
        setActiveTab,
        teamRole,
        setTeamRole,
        currentMission,
        updateSpacecraft,
        updateOrbit,
        updateLaunchVehicle,
        updateMissionParameters,
        validationResults,
        simState,
        isSimRunning,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        setSimulationSpeed,
        restartSimulation,
        savedMissions,
        saveCurrentMission,
        deleteSavedMission,
        duplicateSavedMission,
        loadSavedMission,
        loadCampaign,
        completedReports,
        exportCurrentMission,
        importMissionJSON,
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
}

/**
 * Helper to assemble a complete hydrated mission from scenario IDs
 */
function assembleMissionFromConfig(campaign, config = {}) {
  const bus = BUS_CATALOG.find(b => b.id === config.busId) || BUS_CATALOG[0];
  const power = POWER_CATALOG.find(p => p.id === config.powerId) || POWER_CATALOG[1];
  const battery = BATTERY_CATALOG.find(b => b.id === config.batteryId) || BATTERY_CATALOG[1];
  const instruments = (config.instrumentsIds || [])
    .map(id => INSTRUMENT_CATALOG.find(i => i.id === id))
    .filter(Boolean);
  const comms = COMMS_CATALOG.find(c => c.id === config.commsId) || COMMS_CATALOG[1];
  const adcs = ADCS_CATALOG.find(a => a.id === config.adcsId) || ADCS_CATALOG[1];
  const computing = COMPUTING_CATALOG.find(c => c.id === config.computingId) || COMPUTING_CATALOG[1];
  const thermal = THERMAL_CATALOG.find(t => t.id === config.thermalId) || THERMAL_CATALOG[0];
  const propulsion = PROPULSION_CATALOG.find(p => p.id === config.propulsionId) || PROPULSION_CATALOG[1];
  const launchVehicle = LAUNCH_VEHICLES.find(l => l.id === config.launchVehicleId) || LAUNCH_VEHICLES[1];
  const orbit = ORBIT_CATALOG.find(o => o.id === config.orbitId) || ORBIT_CATALOG[0];

  return {
    id: `mission-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: campaign.title,
    scenarioId: campaign.scenarioId,
    category: campaign.category,
    destination: campaign.destination,
    budgetLimitUSD: campaign.budgetLimitUSD,
    durationDays: campaign.durationDays,
    objectives: campaign.objectives,
    requirements: campaign.requirements,
    deltaVRequiredMs: config.deltaVRequiredMs || 150,
    simulationSeed: 42,
    spacecraft: {
      bus,
      power,
      battery,
      instruments: instruments.length > 0 ? instruments : [INSTRUMENT_CATALOG[0]],
      comms,
      adcs,
      computing,
      thermal,
      propulsion,
    },
    launchVehicle,
    orbit,
  };
}
