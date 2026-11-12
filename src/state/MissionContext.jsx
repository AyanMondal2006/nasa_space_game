
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

import { MISSION_CAMPAIGNS } from '../data/missions.js';

import {
  BUS_CATALOG,
  POWER_CATALOG,
  BATTERY_CATALOG,
  INSTRUMENT_CATALOG,
  COMMS_CATALOG,
  ADCS_CATALOG,
  COMPUTING_CATALOG,
  THERMAL_CATALOG,
  PROPULSION_CATALOG,
} from '../data/spacecraftComponents.js';

import { LAUNCH_VEHICLES } from '../data/launchVehicles.js';
import { ORBIT_CATALOG } from '../data/orbits.js';
import { validateMission } from '../engine/validation/validateMission.js';

import {
  SimulationEngine,
  SIMULATION_PHASES,
} from '../engine/simulation/simulationEngine.js';

import { persistenceService } from '../services/persistenceService.js';
import { exportService } from '../services/exportService.js';

import {
  applyDifficultyToObjectives,
  GAMEPLAY_DIFFICULTY,
  DIFFICULTY_PROFILE_VERSION,
} from '../data/difficultyProfiles.js';

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  // Navigation Section
  const [activeTab, setActiveTab] = useState('home');

  // Local Team Collaborative Role
  const [teamRole, setTeamRole] = useState('Mission Planner');

  // Saved Missions
  const [savedMissions, setSavedMissions] = useState(
    () => persistenceService.getSavedMissions()
  );

  // Recent Mission Outcome Reports
  const [completedReports, setCompletedReports] = useState(() => {
    try {
      const raw =
        localStorage.getItem('astraject_v1_reports') ||
        localStorage.getItem('orbitforge_v1_reports');

      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Active Mission Draft
  const [currentMission, setCurrentMission] = useState(() => {
    const savedActive = persistenceService.getActiveMission();

    if (savedActive) return savedActive;

    // Default to Campaign 1 (Earth Observation).
    const initialCampaign = MISSION_CAMPAIGNS[0];

    return assembleMissionFromConfig(
      initialCampaign,
      initialCampaign.defaultConfiguration
    );
  });

  // Real-time Mission Validation Engine
  const validationResults = useMemo(() => {
    return validateMission(currentMission);
  }, [currentMission]);

  // Simulation Engine Instance
  const simEngineRef = useRef(null);

  const [simState, setSimState] = useState(null);
  const [isSimRunning, setIsSimRunning] = useState(false);

  // Initialize or re-create simulation engine when mission changes.
  const initSimulation = useCallback(() => {
    if (!currentMission) return;

    // Pass the same validation metrics shown to the mission designer
    // into the simulator so final scoring uses the actual configuration.
    const sim = new SimulationEngine(
      currentMission,
      currentMission.simulationSeed || 42,
      validationResults?.metrics ?? null
    );

    simEngineRef.current = sim;

    setSimState({ ...sim.state });
    setIsSimRunning(false);
  }, [currentMission, validationResults]);

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

        const nextState = engine.step(60);

        setSimState({ ...nextState });

        // If completed or failed, save to reports.
        if (
          nextState.status === SIMULATION_PHASES.COMPLETED ||
          nextState.status === SIMULATION_PHASES.FAILED
        ) {
          setIsSimRunning(false);

          if (nextState.score) {
            saveCompletedReport(currentMission, nextState);
          }
        }
      }, 250);
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
      totalCollectedGB: (
        finalSimState.totalDataCollectedMB / 1024
      ).toFixed(2),
      totalDownlinkedGB: (
        finalSimState.totalDataDownlinkedMB / 1024
      ).toFixed(2),
      finalMET: finalSimState.missionTimeSeconds,
    };

    setCompletedReports(prev => {
      const updated = [report, ...prev].slice(0, 20);

      try {
        localStorage.setItem(
          'astraject_v1_reports',
          JSON.stringify(updated)
        );
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

  // Load a Campaign with its selected gameplay difficulty.
  const loadCampaign = (
    campaignId,
    gameplayDifficulty = GAMEPLAY_DIFFICULTY.STANDARD
  ) => {
    const campaign =
      MISSION_CAMPAIGNS.find(c => c.id === campaignId) ||
      MISSION_CAMPAIGNS[0];

    const newMission = assembleMissionFromConfig(
      campaign,
      campaign.defaultConfiguration,
      gameplayDifficulty
    );

    setCurrentMission(newMission);
    persistenceService.setActiveMission(newMission);

    setActiveTab('designer');
  };

  // --------------------------------------------------
  // MISSION SAVE / DELETE / DUPLICATE
  // --------------------------------------------------

  const saveCurrentMission = () => {
    if (!currentMission) {
      return {
        success: false,
        error: 'There is no active mission to save.',
      };
    }

    const saved = persistenceService.saveMission(currentMission);

    if (!saved) {
      return {
        success: false,
        error:
          'Mission could not be saved. Browser storage may be unavailable or full.',
      };
    }

    const updatedMissions = persistenceService.getSavedMissions();

    const saveVerified = updatedMissions.some(
      mission => mission.id === currentMission.id
    );

    if (!saveVerified) {
      return {
        success: false,
        error:
          'Save operation could not be verified in the mission repository.',
      };
    }

    setSavedMissions(updatedMissions);

    return {
      success: true,
      message: `"${currentMission.title}" was saved successfully.`,
    };
  };

  const deleteSavedMission = (missionId) => {
    const deleted = persistenceService.deleteMission(missionId);

    if (!deleted) {
      return {
        success: false,
        error:
          'Mission could not be deleted. Browser storage may be unavailable.',
      };
    }

    const updatedMissions = persistenceService.getSavedMissions();

    const deletionVerified = !updatedMissions.some(
      mission => mission.id === missionId
    );

    if (!deletionVerified) {
      return {
        success: false,
        error: 'Mission deletion could not be verified.',
      };
    }

    setSavedMissions(updatedMissions);

    return {
      success: true,
      message: 'Mission deleted successfully.',
    };
  };

  const duplicateSavedMission = (missionId) => {
    const duplicated = persistenceService.duplicateMission(missionId);

    if (!duplicated) {
      return null;
    }

    const updatedMissions = persistenceService.getSavedMissions();

    // Verify that the duplicate was actually persisted.
    const duplicateVerified = updatedMissions.some(
      mission => mission.id === duplicated.id
    );

    if (!duplicateVerified) {
      return null;
    }

    setSavedMissions(updatedMissions);

    return duplicated;
  };

  const loadSavedMission = (mission) => {
    if (!mission) {
      return {
        success: false,
        persisted: false,
        error: 'No mission was selected.',
      };
    }

    const persisted = persistenceService.setActiveMission(mission);

    // The design can still be loaded into the current application session
    // even when browser persistence fails.
    setCurrentMission(mission);
    setActiveTab('designer');

    return {
      success: true,
      persisted,
      error: persisted
        ? null
        : 'Mission loaded for this session, but the active draft could not be saved to browser storage.',
    };
  };

  // --------------------------------------------------
  // MISSION EXPORT & IMPORT
  // --------------------------------------------------

  const exportCurrentMission = () => {
    if (!currentMission) {
      return {
        success: false,
        error: 'There is no active mission to export.',
      };
    }

    try {
      exportService.exportMissionJSON(currentMission);

      return {
        success: true,
        message: 'Mission export initiated successfully.',
      };
    } catch (err) {
      console.error('Mission export failed:', err);

      return {
        success: false,
        error: 'Mission export failed. Please try again.',
      };
    }
  };

  const importMissionJSON = (jsonString) => {
    const result = exportService.validateImportedJSON(jsonString);

    if (!result.isValid) {
      return {
        success: false,
        error: result.error,
      };
    }

    const importedMission = result.mission;

    // First persist the imported mission in the saved repository.
    const missionSaved = persistenceService.saveMission(importedMission);

    if (!missionSaved) {
      return {
        success: false,
        error:
          'Mission validation succeeded, but the imported mission could not be saved to the repository. Check browser storage.',
      };
    }

    const updatedMissions = persistenceService.getSavedMissions();

    const saveVerified = updatedMissions.some(
      mission => mission.id === importedMission.id
    );

    if (!saveVerified) {
      return {
        success: false,
        error:
          'Imported mission could not be verified in the saved repository.',
      };
    }

    setSavedMissions(updatedMissions);

    // Persist the active draft before replacing the current workspace.
    const activeSaved = persistenceService.setActiveMission(
      importedMission
    );

    if (!activeSaved) {
      return {
        success: false,
        error:
          'Mission was added to Saved Missions, but could not be activated as the current draft because browser storage failed.',
      };
    }

    setCurrentMission(importedMission);
    setActiveTab('designer');

    return {
      success: true,
      message: 'Mission imported, saved and loaded successfully.',
    };
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
    throw new Error(
      'useMission must be used within a MissionProvider'
    );
  }

  return context;
}

/**
 * Helper to assemble a complete hydrated mission from scenario IDs.
 *
 * Campaign-specific propellant values override the catalog default only
 * when they are valid finite non-negative numbers.
 *
 * Invalid values fall back to the selected propulsion catalog component.
 * The shared catalog is never mutated.
 */
export function assembleMissionFromConfig(
  campaign,
  config = {},
  gameplayDifficulty = GAMEPLAY_DIFFICULTY.STANDARD
) {
  const bus =
    BUS_CATALOG.find(b => b.id === config.busId) || BUS_CATALOG[0];

  const power =
    POWER_CATALOG.find(p => p.id === config.powerId) || POWER_CATALOG[1];

  const battery =
    BATTERY_CATALOG.find(b => b.id === config.batteryId) ||
    BATTERY_CATALOG[1];

  const instruments = (config.instrumentsIds || [])
    .map(id => INSTRUMENT_CATALOG.find(i => i.id === id))
    .filter(Boolean);

  const comms =
    COMMS_CATALOG.find(c => c.id === config.commsId) || COMMS_CATALOG[1];

  const adcs =
    ADCS_CATALOG.find(a => a.id === config.adcsId) || ADCS_CATALOG[1];

  const computing =
    COMPUTING_CATALOG.find(c => c.id === config.computingId) ||
    COMPUTING_CATALOG[1];

  const thermal =
    THERMAL_CATALOG.find(t => t.id === config.thermalId) ||
    THERMAL_CATALOG[0];

  const selectedPropulsion =
    PROPULSION_CATALOG.find(p => p.id === config.propulsionId) ||
    PROPULSION_CATALOG[1];

  // Validate the campaign-specific propellant load.
  const rawPropellantLoad = config.propellantLoadKg;

  const parsedPropellantLoad =
    typeof rawPropellantLoad === 'number' ||
    (typeof rawPropellantLoad === 'string' &&
      rawPropellantLoad.trim() !== '')
      ? Number(rawPropellantLoad)
      : NaN;

  const hasValidPropellantLoad =
    Number.isFinite(parsedPropellantLoad) &&
    parsedPropellantLoad >= 0;

  // Clone the catalog entry only when a valid override is provided.
  const propulsion = hasValidPropellantLoad
    ? {
        ...selectedPropulsion,
        initialPropellantKg: parsedPropellantLoad,
      }
    : selectedPropulsion;

  const launchVehicle =
    LAUNCH_VEHICLES.find(l => l.id === config.launchVehicleId) ||
    LAUNCH_VEHICLES[1];

  const orbit =
    ORBIT_CATALOG.find(o => o.id === config.orbitId) ||
    ORBIT_CATALOG[0];

  const selectedDifficulty = Object.values(
    GAMEPLAY_DIFFICULTY
  ).includes(gameplayDifficulty)
    ? gameplayDifficulty
    : GAMEPLAY_DIFFICULTY.STANDARD;

  return {
    id: `mission-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: campaign.title,
    scenarioId: campaign.scenarioId,
    category: campaign.category,
    destination: campaign.destination,
    budgetLimitUSD: campaign.budgetLimitUSD,
    durationDays: campaign.durationDays,
    campaignDifficulty: campaign.difficulty || 'Configurable',
    gameplayDifficulty: selectedDifficulty,
    difficultyProfileVersion: DIFFICULTY_PROFILE_VERSION,
    objectives: applyDifficultyToObjectives(
      campaign.objectives,
      selectedDifficulty
    ),
    requirements: campaign.requirements,
    deltaVRequiredMs: config.deltaVRequiredMs ?? 150,
    simulationSeed: 42,

    spacecraft: {
      bus,
      power,
      battery,
      instruments:
        instruments.length > 0
          ? instruments
          : [INSTRUMENT_CATALOG[0]],
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
