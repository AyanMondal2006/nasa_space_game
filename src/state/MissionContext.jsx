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

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  /*
   * ============================================================
   * Navigation
   * ============================================================
   */

  const [activeTab, setActiveTab] = useState('home');

  /*
   * ============================================================
   * Team role
   * ============================================================
   */

  const [teamRole, setTeamRole] =
    useState('Mission Planner');

  /*
   * ============================================================
   * Saved missions
   * ============================================================
   */

  const [savedMissions, setSavedMissions] =
    useState(() =>
      persistenceService.getSavedMissions()
    );

  /*
   * ============================================================
   * Completed mission reports
   * ============================================================
   */

  const [completedReports, setCompletedReports] =
    useState(() => {
      try {
        const raw =
          localStorage.getItem(
            'astraject_v1_reports'
          ) ||
          localStorage.getItem(
            'orbitforge_v1_reports'
          );

        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    });

  /*
   * ============================================================
   * Active mission
   * ============================================================
   */

  const [currentMission, setCurrentMission] =
    useState(() => {
      const savedActive =
        persistenceService.getActiveMission();

      if (savedActive) {
        return savedActive;
      }

      /*
       * Default to Campaign 1
       * (Earth Observation)
       */
      const initialCampaign =
        MISSION_CAMPAIGNS[0];

      return assembleMissionFromConfig(
        initialCampaign,
        initialCampaign.defaultConfiguration
      );
    });

  /*
   * ============================================================
   * REAL-TIME MISSION VALIDATION
   * ============================================================
   *
   * Every time currentMission changes:
   *
   * currentMission
   *       ↓
   * validateMission()
   *       ↓
   * validationResults
   *       ↓
   * validationResults.metrics
   *
   * The metrics are subsequently passed into
   * SimulationEngine for final scoring.
   */

  const validationResults = useMemo(() => {
    return validateMission(currentMission);
  }, [currentMission]);

  /*
   * ============================================================
   * Simulation state
   * ============================================================
   */

  const simEngineRef = useRef(null);

  const [simState, setSimState] =
    useState(null);

  const [isSimRunning, setIsSimRunning] =
    useState(false);

  /*
   * ============================================================
   * Initialize / recreate simulation engine
   * ============================================================
   *
   * IMPORTANT FIX:
   *
   * validationResults.metrics is passed into
   * SimulationEngine.
   *
   * This allows the scoring engine to use the actual:
   *
   * - mass metrics
   * - power metrics
   * - budget metrics
   * - data metrics
   * - communication metrics
   * - orbit metrics
   *
   * instead of receiving null.
   */

  const initSimulation = useCallback(() => {
    if (!currentMission) {
      return;
    }

    const validationMetrics =
      validationResults?.metrics ?? null;

    const sim = new SimulationEngine(
      currentMission,
      currentMission.simulationSeed || 42,
      validationMetrics
    );

    simEngineRef.current = sim;

    setSimState({
      ...sim.state,
    });

    setIsSimRunning(false);
  }, [
    currentMission,
    validationResults,
  ]);

  /*
   * Recreate simulation whenever:
   *
   * - mission changes
   * - validation metrics change
   */

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  /*
   * ============================================================
   * REAL-TIME SIMULATION LOOP
   * ============================================================
   */

  useEffect(() => {
    let timerId;

    if (
      isSimRunning &&
      simEngineRef.current
    ) {
      timerId = setInterval(() => {
        const engine =
          simEngineRef.current;

        if (
          !engine ||
          engine.state.isPaused
        ) {
          return;
        }

        /*
         * Advance simulation by
         * 60 simulated seconds.
         */
        const nextState =
          engine.step(60);

        setSimState({
          ...nextState,
        });

        /*
         * Save completed/failed mission
         * automatically.
         */
        if (
          nextState.status ===
            SIMULATION_PHASES.COMPLETED ||
          nextState.status ===
            SIMULATION_PHASES.FAILED
        ) {
          setIsSimRunning(false);

          /*
           * Score can legitimately be 0,
           * therefore do not use:
           *
           * if (nextState.score)
           *
           * because 0 is falsy.
           *
           * Instead explicitly check that
           * a score exists.
           */

          if (
            nextState.score !== null &&
            nextState.score !== undefined
          ) {
            saveCompletedReport(
              currentMission,
              nextState
            );
          }
        }
      }, 250);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [
    isSimRunning,
    currentMission,
  ]);

  /*
   * ============================================================
   * Save completed mission report
   * ============================================================
   */

  const saveCompletedReport = (
    mission,
    finalSimState
  ) => {
    const report = {
      id: `report-${Date.now()}`,

      missionId: mission.id,

      missionTitle:
        mission.title,

      scenarioId:
        mission.scenarioId,

      destination:
        mission.destination,

      completedAt:
        new Date().toISOString(),

      status:
        finalSimState.status,

      score:
        finalSimState.score,

      telemetryHistory:
        finalSimState.telemetryHistory,

      events:
        finalSimState.events,

      totalCollectedGB:
        (
          finalSimState.totalDataCollectedMB /
          1024
        ).toFixed(2),

      totalDownlinkedGB:
        (
          finalSimState.totalDataDownlinkedMB /
          1024
        ).toFixed(2),

      finalMET:
        finalSimState.missionTimeSeconds,
    };

    setCompletedReports(
      (previousReports) => {
        const updated = [
          report,
          ...previousReports,
        ].slice(0, 20);

        try {
          localStorage.setItem(
            'astraject_v1_reports',
            JSON.stringify(updated)
          );
        } catch (err) {
          console.error(
            'Failed to save report:',
            err
          );
        }

        return updated;
      }
    );
  };

  /*
   * ============================================================
   * Simulation controls
   * ============================================================
   */

  const startSimulation = () => {
    if (!simEngineRef.current) {
      initSimulation();
    }

    if (!simEngineRef.current) {
      return;
    }

    simEngineRef.current.start();

    setIsSimRunning(true);

    setSimState({
      ...simEngineRef.current.state,
    });
  };

  const pauseSimulation = () => {
    if (!simEngineRef.current) {
      return;
    }

    simEngineRef.current.pause();

    setIsSimRunning(false);

    setSimState({
      ...simEngineRef.current.state,
    });
  };

  const resumeSimulation = () => {
    if (!simEngineRef.current) {
      return;
    }

    simEngineRef.current.resume();

    setIsSimRunning(true);

    setSimState({
      ...simEngineRef.current.state,
    });
  };

  const setSimulationSpeed = (
    multiplier
  ) => {
    if (!simEngineRef.current) {
      return;
    }

    simEngineRef.current.setSpeed(
      multiplier
    );

    setSimState({
      ...simEngineRef.current.state,
    });
  };

  const restartSimulation = () => {
    initSimulation();
  };

  /*
   * ============================================================
   * Spacecraft mutations
   * ============================================================
   */

  const updateSpacecraft = (
    subsystemKey,
    componentOrArray
  ) => {
    setCurrentMission((previousMission) => {
      const nextMission = {
        ...previousMission,

        spacecraft: {
          ...previousMission.spacecraft,

          [subsystemKey]:
            componentOrArray,
        },
      };

      persistenceService.setActiveMission(
        nextMission
      );

      return nextMission;
    });
  };

  /*
   * ============================================================
   * Orbit update
   * ============================================================
   */

  const updateOrbit = (orbit) => {
    setCurrentMission((previousMission) => {
      const nextMission = {
        ...previousMission,

        orbit,

        targetOrbitId:
          orbit?.id,
      };

      persistenceService.setActiveMission(
        nextMission
      );

      return nextMission;
    });
  };

  /*
   * ============================================================
   * Launch vehicle update
   * ============================================================
   */

  const updateLaunchVehicle = (
    launchVehicle
  ) => {
    setCurrentMission((previousMission) => {
      const nextMission = {
        ...previousMission,

        launchVehicle,

        launchVehicleId:
          launchVehicle?.id,
      };

      persistenceService.setActiveMission(
        nextMission
      );

      return nextMission;
    });
  };

  /*
   * ============================================================
   * Mission parameter update
   * ============================================================
   */

  const updateMissionParameters = (
    params
  ) => {
    setCurrentMission((previousMission) => {
      const nextMission = {
        ...previousMission,
        ...params,
      };

      persistenceService.setActiveMission(
        nextMission
      );

      return nextMission;
    });
  };

  /*
   * ============================================================
   * Load campaign
   * ============================================================
   */

  const loadCampaign = (
    campaignId
  ) => {
    const campaign =
      MISSION_CAMPAIGNS.find(
        (candidate) =>
          candidate.id === campaignId
      ) ||
      MISSION_CAMPAIGNS[0];

    const newMission =
      assembleMissionFromConfig(
        campaign,
        campaign.defaultConfiguration
      );

    setCurrentMission(
      newMission
    );

    persistenceService.setActiveMission(
      newMission
    );

    setActiveTab('designer');
  };

  /*
   * ============================================================
   * Saved mission operations
   * ============================================================
   */

  const saveCurrentMission = () => {
    if (!currentMission) {
      return;
    }

    persistenceService.saveMission(
      currentMission
    );

    setSavedMissions(
      persistenceService.getSavedMissions()
    );
  };

  const deleteSavedMission = (
    missionId
  ) => {
    persistenceService.deleteMission(
      missionId
    );

    setSavedMissions(
      persistenceService.getSavedMissions()
    );
  };

  const duplicateSavedMission = (
    missionId
  ) => {
    const duplicate =
      persistenceService.duplicateMission(
        missionId
      );

    if (duplicate) {
      setSavedMissions(
        persistenceService.getSavedMissions()
      );
    }

    return duplicate;
  };

  const loadSavedMission = (
    mission
  ) => {
    setCurrentMission(
      mission
    );

    persistenceService.setActiveMission(
      mission
    );

    setActiveTab('designer');
  };

  /*
   * ============================================================
   * Export mission
   * ============================================================
   */

  const exportCurrentMission = () => {
    exportService.exportMissionJSON(
      currentMission
    );
  };

  /*
   * ============================================================
   * Import mission
   * ============================================================
   */

  const importMissionJSON = (
    jsonString
  ) => {
    const result =
      exportService.validateImportedJSON(
        jsonString
      );

    if (result.isValid) {
      setCurrentMission(
        result.mission
      );

      persistenceService.setActiveMission(
        result.mission
      );

      persistenceService.saveMission(
        result.mission
      );

      setSavedMissions(
        persistenceService.getSavedMissions()
      );

      return {
        success: true,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  };

  /*
   * ============================================================
   * Context provider
   * ============================================================
   */

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

        /*
         * Expose validation results
         * to frontend components.
         */
        validationResults,

        /*
         * Simulation state
         */
        simState,
        isSimRunning,

        startSimulation,
        pauseSimulation,
        resumeSimulation,
        setSimulationSpeed,
        restartSimulation,

        /*
         * Mission persistence
         */
        savedMissions,

        saveCurrentMission,
        deleteSavedMission,
        duplicateSavedMission,
        loadSavedMission,
        loadCampaign,

        /*
         * Reports
         */
        completedReports,

        /*
         * Import/export
         */
        exportCurrentMission,
        importMissionJSON,
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

/*
 * ==============================================================
 * useMission hook
 * ==============================================================
 */

export function useMission() {
  const context =
    useContext(MissionContext);

  if (!context) {
    throw new Error(
      'useMission must be used within a MissionProvider'
    );
  }

  return context;
}

/*
 * ==============================================================
 * Mission assembly helper
 * ==============================================================
 *
 * Converts campaign configuration IDs into complete
 * hydrated mission objects.
 */

function assembleMissionFromConfig(
  campaign,
  config = {}
) {
  const bus =
    BUS_CATALOG.find(
      (component) =>
        component.id === config.busId
    ) ||
    BUS_CATALOG[0];

  const power =
    POWER_CATALOG.find(
      (component) =>
        component.id === config.powerId
    ) ||
    POWER_CATALOG[1];

  const battery =
    BATTERY_CATALOG.find(
      (component) =>
        component.id === config.batteryId
    ) ||
    BATTERY_CATALOG[1];

  const instruments =
    (config.instrumentsIds || [])
      .map((id) =>
        INSTRUMENT_CATALOG.find(
          (instrument) =>
            instrument.id === id
        )
      )
      .filter(Boolean);

  const comms =
    COMMS_CATALOG.find(
      (component) =>
        component.id === config.commsId
    ) ||
    COMMS_CATALOG[1];

  const adcs =
    ADCS_CATALOG.find(
      (component) =>
        component.id === config.adcsId
    ) ||
    ADCS_CATALOG[1];

  const computing =
    COMPUTING_CATALOG.find(
      (component) =>
        component.id === config.computingId
    ) ||
    COMPUTING_CATALOG[1];

  const thermal =
    THERMAL_CATALOG.find(
      (component) =>
        component.id === config.thermalId
    ) ||
    THERMAL_CATALOG[0];

  const propulsion =
    PROPULSION_CATALOG.find(
      (component) =>
        component.id === config.propulsionId
    ) ||
    PROPULSION_CATALOG[1];

  const launchVehicle =
    LAUNCH_VEHICLES.find(
      (vehicle) =>
        vehicle.id ===
        config.launchVehicleId
    ) ||
    LAUNCH_VEHICLES[1];

  const orbit =
    ORBIT_CATALOG.find(
      (candidate) =>
        candidate.id === config.orbitId
    ) ||
    ORBIT_CATALOG[0];

  return {
    id: `mission-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`,

    title:
      campaign.title,

    scenarioId:
      campaign.scenarioId,

    category:
      campaign.category,

    destination:
      campaign.destination,

    budgetLimitUSD:
      campaign.budgetLimitUSD,

    durationDays:
      campaign.durationDays,

    objectives:
      campaign.objectives,

    requirements:
      campaign.requirements,

    deltaVRequiredMs:
      config.deltaVRequiredMs || 150,

    simulationSeed:
      42,

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