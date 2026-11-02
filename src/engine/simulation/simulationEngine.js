/**
 * Deterministic Discrete-Event Spacecraft Simulation Engine
 * Advances spacecraft orbital state, power collection, day/night eclipse transitions,
 * scientific data collection, ground station pass contacts, and telemetry logging.
 */

import { SeededRandom } from '../../utils/seededRandom.js';
import { calculateCircularOrbit, getOrbitPositionAndEclipse, getSubSatelliteCoordinates } from '../calculations/orbitalMechanics.js';
import { calculatePowerBudget } from '../calculations/power.js';
import { calculateDataBudget } from '../calculations/data.js';
import { calculateCommunicationsBudget } from '../calculations/communications.js';
import { calculateMissionScore } from './missionScoring.js';
import { CELESTIAL_BODIES } from '../constants/physics.js';
import { formatMET } from '../../utils/formatters.js';

export const SIMULATION_PHASES = {
  PRE_LAUNCH: 'PRE_LAUNCH',
  LAUNCH: 'LAUNCH',
  ORBIT_INSERTION: 'ORBIT_INSERTION',
  COMMISSIONING: 'COMMISSIONING',
  PRIMARY_OPS: 'PRIMARY_OPS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export class SimulationEngine {
  constructor(mission, seed = 123456789) {
    this.mission = mission;
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    this.reset();
  }

  reset() {
    this.rng.reset();
    const dest = this.mission?.destination || 'earth';
    const alt = this.mission?.orbit?.altitudeKm || 500;
    const inc = this.mission?.orbit?.inclinationDeg || 45;

    this.orbitCalc = calculateCircularOrbit(dest, alt, inc);
    this.celestialBody = CELESTIAL_BODIES[dest] || CELESTIAL_BODIES.earth;

    const totalBatteryCapacityWh = Number(this.mission?.spacecraft?.battery?.capacityWh) || 1000;
    const storageCapacityGB = Number(this.mission?.spacecraft?.computing?.storageCapacityGB) || 64;

    this.state = {
      status: SIMULATION_PHASES.PRE_LAUNCH,
      missionTimeSeconds: 0,
      targetDurationSeconds: (this.mission?.durationDays || 90) * 86400,
      isPaused: true,
      simulationSpeed: 1, // 1x, 2x, 5x, 10x
      
      // Orbit & Position
      orbitAngleRad: 0,
      latitude: 0,
      longitude: 0,
      isInEclipse: false,
      altitudeKm: alt,

      // Power & Battery
      currentPowerGenerationW: 0,
      currentPowerConsumptionW: 0,
      batteryEnergyWh: totalBatteryCapacityWh, // Starts fully charged on launchpad
      batteryCapacityWh: totalBatteryCapacityWh,
      batteryPercent: 100,

      // Data & Storage
      onboardStoredDataMB: 0,
      maxStorageMB: storageCapacityGB * 1024,
      totalDataCollectedMB: 0,
      totalDataDownlinkedMB: 0,

      // Comms & Contact
      isContactingGroundStation: false,
      activeGroundStation: null,
      currentDownlinkRateMbps: 0,
      linkMarginDb: 12.5,

      // Subsystems Health (0-100%)
      subsystemHealth: {
        bus: 100,
        power: 100,
        battery: 100,
        instruments: 100,
        comms: 100,
        adcs: 100,
        thermal: 100,
        propulsion: 100,
      },

      // Objectives tracking
      objectivesProgress: {},
      events: [],
      telemetryHistory: [],
      score: null,
      failureReason: null,
    };

    // Pre-populate objectives
    (this.mission?.objectives || []).forEach(obj => {
      this.state.objectivesProgress[obj.id] = 0;
    });

    this.logEvent('INFO', 'PRE-LAUNCH', 'Spacecraft pre-flight diagnostics verified. All systems nominal on pad.');
  }

  logEvent(severity, category, message) {
    const event = {
      id: `evt-${Date.now()}-${this.rng.intRange(1000, 9999)}`,
      timeSeconds: this.state.missionTimeSeconds,
      timeFormatted: formatMET(this.state.missionTimeSeconds),
      severity, // 'INFO' | 'MILESTONE' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
      category,
      message,
    };
    this.state.events.unshift(event); // Newest first
    if (this.state.events.length > 150) {
      this.state.events.pop();
    }
  }

  start() {
    this.state.isPaused = false;
    if (this.state.status === SIMULATION_PHASES.PRE_LAUNCH) {
      this.state.status = SIMULATION_PHASES.LAUNCH;
      this.logEvent('MILESTONE', 'LAUNCH', `Ignition and Liftoff confirmed aboard ${this.mission?.launchVehicle?.name || 'Launch Vehicle'}!`);
    }
  }

  pause() {
    this.state.isPaused = true;
  }

  resume() {
    this.state.isPaused = false;
  }

  setSpeed(speedMultiplier) {
    this.state.simulationSpeed = Math.max(1, Math.min(20, speedMultiplier));
  }

  /**
   * Advances the simulation by a discrete delta-time in seconds.
   * Scaled by simulationSpeed.
   */
  step(baseDeltaSeconds = 60) {
    if (this.state.isPaused || this.state.status === SIMULATION_PHASES.COMPLETED || this.state.status === SIMULATION_PHASES.FAILED) {
      return this.state;
    }

    const dt = baseDeltaSeconds * this.state.simulationSpeed;
    this.state.missionTimeSeconds += dt;

    // 1. Mission Phase Transitions
    const t = this.state.missionTimeSeconds;

    if (this.state.status === SIMULATION_PHASES.LAUNCH && t >= 600) {
      this.state.status = SIMULATION_PHASES.ORBIT_INSERTION;
      this.logEvent('MILESTONE', 'STAGE SEP', 'Second stage shutdown. Spacecraft payload separated into preliminary orbit.');
    } else if (this.state.status === SIMULATION_PHASES.ORBIT_INSERTION && t >= 1800) {
      this.state.status = SIMULATION_PHASES.COMMISSIONING;
      this.logEvent('MILESTONE', 'DEPLOYMENT', 'Solar array deployment mechanisms fired successfully. Star trackers acquire inertial lock.');
    } else if (this.state.status === SIMULATION_PHASES.COMMISSIONING && t >= 7200) {
      this.state.status = SIMULATION_PHASES.PRIMARY_OPS;
      this.logEvent('SUCCESS', 'SCIENCE OPS', 'Initial commissioning complete. Primary payload science observation sequence initiated.');
    }

    // 2. Orbital Kinematics
    const meanMotion = this.orbitCalc.meanMotionRadPerSec;
    this.state.orbitAngleRad = (this.state.orbitAngleRad + (meanMotion * dt)) % (2 * Math.PI);

    // Calculate sub-satellite ground coordinates
    const incRad = (this.orbitCalc.inclinationDeg * Math.PI) / 180;
    const coords = getSubSatelliteCoordinates(
      this.state.orbitAngleRad,
      incRad,
      this.state.missionTimeSeconds,
      this.celestialBody.rotationPeriod
    );
    this.state.latitude = coords.latitude;
    this.state.longitude = coords.longitude;

    // Eclipse geometry
    const orbitPos = getOrbitPositionAndEclipse(
      this.orbitCalc.radiusM,
      incRad,
      this.state.orbitAngleRad,
      this.celestialBody.radius
    );
    const wasInEclipse = this.state.isInEclipse;
    this.state.isInEclipse = orbitPos.isInEclipse;

    if (!wasInEclipse && this.state.isInEclipse) {
      this.logEvent('INFO', 'ECLIPSE ENTRY', 'Spacecraft entered planetary shadow (umbra). Solar power offline, switching to secondary battery.');
    } else if (wasInEclipse && !this.state.isInEclipse) {
      this.logEvent('INFO', 'SUNLIGHT EXIT', 'Sunrise confirmed. Solar arrays generating power; recharging battery reserve.');
    }

    // 3. Power Generation & Consumption
    const powerConfig = calculatePowerBudget({
      powerSource: this.mission?.spacecraft?.power,
      battery: this.mission?.spacecraft?.battery,
      instruments: this.mission?.spacecraft?.instruments,
      comms: this.mission?.spacecraft?.comms,
      adcs: this.mission?.spacecraft?.adcs,
      computing: this.mission?.spacecraft?.computing,
      thermal: this.mission?.spacecraft?.thermal,
      orbit: this.orbitCalc,
      bodyId: this.mission?.destination,
    });

    if (this.state.status === SIMULATION_PHASES.LAUNCH) {
      // Internal battery power during launch under fairing
      this.state.currentPowerGenerationW = 0;
      this.state.currentPowerConsumptionW = powerConfig.busBasePowerW * 0.5;
    } else if (this.state.isInEclipse) {
      this.state.currentPowerGenerationW = powerConfig.eclipseGenerationW;
      this.state.currentPowerConsumptionW = powerConfig.eclipseLoadW;
    } else {
      this.state.currentPowerGenerationW = powerConfig.daylightGenerationW;
      this.state.currentPowerConsumptionW = powerConfig.daylightLoadW;
    }

    // Battery Integration: dE = (P_gen - P_load) * dt
    const netPowerWatts = this.state.currentPowerGenerationW - this.state.currentPowerConsumptionW;
    const netEnergyWh = (netPowerWatts * dt) / 3600;

    this.state.batteryEnergyWh = Math.max(
      0,
      Math.min(this.state.batteryCapacityWh, this.state.batteryEnergyWh + netEnergyWh)
    );
    this.state.batteryPercent = (this.state.batteryEnergyWh / this.state.batteryCapacityWh) * 100;

    // Check for catastrophic battery exhaustion
    if (this.state.batteryEnergyWh <= 0 && this.state.isInEclipse) {
      this.state.status = SIMULATION_PHASES.FAILED;
      this.state.failureReason = 'Battery completely exhausted during orbital eclipse. Spacecraft browned out and tumbled into uncontrolled spin.';
      this.logEvent('CRITICAL', 'POWER LOSS', this.state.failureReason);
      this.evaluateFinalScore();
      return this.state;
    }

    // 4. Ground Station Contact Window Evaluation
    this.updateGroundStationContact();

    // 5. Scientific Data Generation & Downlink
    if (this.state.status === SIMULATION_PHASES.PRIMARY_OPS) {
      const dataCalc = calculateDataBudget({
        instruments: this.mission?.spacecraft?.instruments || [],
        computing: this.mission?.spacecraft?.computing,
        dutyCycleFraction: 0.6,
      });

      // Data generated in this tick (MB)
      const dataGenTickMB = (dataCalc.effectiveRateMBps * dt);
      this.state.totalDataCollectedMB += dataGenTickMB;
      this.state.onboardStoredDataMB = Math.min(
        this.state.maxStorageMB,
        this.state.onboardStoredDataMB + dataGenTickMB
      );

      // Downlink execution if contacting ground station
      if (this.state.isContactingGroundStation) {
        const commsCalc = calculateCommunicationsBudget({
          comms: this.mission?.spacecraft?.comms,
          bodyId: this.mission?.destination,
          altitudeKm: this.orbitCalc.altitudeKm,
        });

        this.state.currentDownlinkRateMbps = commsCalc.effectiveDownlinkRateMbps;
        const downlinkCapacityMB = commsCalc.effectiveDownlinkRateMBps * dt;
        const actualDownlinkedMB = Math.min(this.state.onboardStoredDataMB, downlinkCapacityMB);

        this.state.onboardStoredDataMB -= actualDownlinkedMB;
        this.state.totalDataDownlinkedMB += actualDownlinkedMB;
      } else {
        this.state.currentDownlinkRateMbps = 0;
      }
    }

    // 6. Probabilistic Aerospace Anomalies (Deterministic Seed)
    this.checkAnomalies(dt);

    // 7. Update Objective Progress
    this.updateObjectivesProgress();

    // 8. Log Periodic Telemetry History for Charts (every ~200-500s or whenever throttled)
    if (this.state.telemetryHistory.length === 0 || (t - this.state.telemetryHistory[this.state.telemetryHistory.length - 1].timeSeconds) >= 180) {
      this.recordTelemetrySnapshot();
    }

    // 9. Mission Duration Completion Check
    if (this.state.missionTimeSeconds >= this.state.targetDurationSeconds) {
      this.state.status = SIMULATION_PHASES.COMPLETED;
      this.logEvent('SUCCESS', 'MISSION COMPLETE', 'Planned mission duration reached! Final science telemetry verified and compiled.');
      this.evaluateFinalScore();
    }

    return this.state;
  }

  updateGroundStationContact() {
    const stations = this.celestialBody.groundStations || [];
    let contacting = false;
    let contactStation = null;

    if (this.celestialBody.id === 'earth') {
      // In LEO, satellite must pass within horizon visibility angle (~2000 km)
      for (const st of stations) {
        const dLat = Math.abs(this.state.latitude - st.lat);
        const dLon = Math.abs(this.state.longitude - st.lon);
        // Simple angular distance threshold for line of sight (~20 degrees)
        if (dLat < 18 && (dLon < 22 || dLon > (360 - 22))) {
          contacting = true;
          contactStation = st.name;
          break;
        }
      }
    } else {
      // Deep Space Network (DSN) link visibility
      // Earth DSN stations track deep space probes for scheduled windows (e.g. 50% duty cycle)
      const dsnWindow = Math.sin((this.state.missionTimeSeconds / 86400) * (2 * Math.PI) * 2);
      if (dsnWindow > -0.2) {
        contacting = true;
        contactStation = 'Deep Space Network 70m Antenna Array';
      }
    }

    if (!this.state.isContactingGroundStation && contacting) {
      this.logEvent('INFO', 'GROUND CONTACT', `Carrier lock established with ${contactStation}. High-rate science telemetry downlink active.`);
    } else if (this.state.isContactingGroundStation && !contacting) {
      this.logEvent('INFO', 'CONTACT LOSS', `AOS/LOS transition. Spacecraft passed beyond ground station horizon.`);
    }

    this.state.isContactingGroundStation = contacting;
    this.state.activeGroundStation = contactStation;
  }

  checkAnomalies(dt) {
    // Only trigger occasional anomalies during primary operations
    if (this.state.status !== SIMULATION_PHASES.PRIMARY_OPS) return;

    // 0.05% chance per hour of minor telemetry events
    const hourlyChance = 0.0005 * (dt / 3600);
    if (this.rng.chance(hourlyChance)) {
      const anomalyTypes = [
        {
          subsystem: 'adcs',
          msg: 'Minor star tracker bright particle noise detected. Reaction wheel attitude bias trimmed automatically.',
          healthImpact: 2,
        },
        {
          subsystem: 'comms',
          msg: 'Solar radio burst caused transient bit errors during ground pass. Error-correcting Reed-Solomon codes recovered frames.',
          healthImpact: 1,
        },
        {
          subsystem: 'thermal',
          msg: 'Solar aspect angle shifted payload radiator temperature by +2.5°C. Active louvers compensated.',
          healthImpact: 0,
        },
        {
          subsystem: 'battery',
          msg: 'Lithium-ion cell balance circuitry completed automated periodic reconditioning cycle.',
          healthImpact: 1,
        },
      ];

      const anomaly = this.rng.choice(anomalyTypes);
      this.state.subsystemHealth[anomaly.subsystem] = Math.max(
        60,
        this.state.subsystemHealth[anomaly.subsystem] - anomaly.healthImpact
      );
      this.logEvent('WARNING', 'ANOMALY', anomaly.msg);
    }
  }

  updateObjectivesProgress() {
    const objectives = this.mission?.objectives || [];
    const totalCollectedGB = this.state.totalDataCollectedMB / 1024;
    const totalDownlinkedGB = this.state.totalDataDownlinkedMB / 1024;

    objectives.forEach(obj => {
      let progress = 0;
      if (obj.type === 'data_volume') {
        const target = obj.targetValueGB || 100;
        progress = Math.min(100, (totalDownlinkedGB / target) * 100);
      } else if (obj.type === 'downlink_efficiency') {
        const targetPercent = obj.targetValuePercent || 85;
        const actualPercent = this.state.totalDataCollectedMB > 0 
          ? (this.state.totalDataDownlinkedMB / this.state.totalDataCollectedMB) * 100 
          : 0;
        progress = Math.min(100, (actualPercent / targetPercent) * 100);
      } else if (obj.type === 'battery_health') {
        const minBattery = this.state.batteryPercent;
        progress = minBattery >= 50 ? 100 : Math.max(0, minBattery * 2);
      } else if (obj.type === 'budget_performance') {
        progress = 100;
      } else if (obj.type === 'orbital_insertion') {
        progress = this.state.status === SIMULATION_PHASES.PRIMARY_OPS || this.state.status === SIMULATION_PHASES.COMPLETED ? 100 : 30;
      } else {
        progress = Math.min(100, (this.state.missionTimeSeconds / this.state.targetDurationSeconds) * 100);
      }
      this.state.objectivesProgress[obj.id] = Math.round(progress);
    });
  }

  recordTelemetrySnapshot() {
    const snapshot = {
      timeSeconds: this.state.missionTimeSeconds,
      timeFormatted: formatMET(this.state.missionTimeSeconds),
      powerGenerationW: Math.round(this.state.currentPowerGenerationW),
      powerConsumptionW: Math.round(this.state.currentPowerConsumptionW),
      batteryPercent: Number(this.state.batteryPercent.toFixed(1)),
      batteryEnergyWh: Math.round(this.state.batteryEnergyWh),
      storedDataMB: Math.round(this.state.onboardStoredDataMB),
      downlinkMbps: Number(this.state.currentDownlinkRateMbps.toFixed(2)),
      totalDownlinkedGB: Number((this.state.totalDataDownlinkedMB / 1024).toFixed(2)),
      isInEclipse: this.state.isInEclipse,
      hasContact: this.state.isContactingGroundStation,
    };

    this.state.telemetryHistory.push(snapshot);
    if (this.state.telemetryHistory.length > 200) {
      this.state.telemetryHistory.shift();
    }
  }

  evaluateFinalScore() {
    this.state.score = calculateMissionScore({
      mission: this.mission,
      simulationState: this.state,
      validationMetrics: null,
    });
  }
}
