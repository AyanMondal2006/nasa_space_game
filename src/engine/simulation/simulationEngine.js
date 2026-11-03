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

    // Preserve an explicitly configured zero battery capacity.
    // Apply the 1000 Wh fallback only when the capacity is missing.
    const configuredBatteryCapacityWh = this.mission?.spacecraft?.battery?.capacityWh;
    const parsedBatteryCapacityWh = configuredBatteryCapacityWh == null
      ? 1000
      : Number(configuredBatteryCapacityWh);

    const totalBatteryCapacityWh = Number.isFinite(parsedBatteryCapacityWh) && parsedBatteryCapacityWh >= 0
      ? parsedBatteryCapacityWh
      : 0;

    // Preserve an explicitly configured zero storage capacity.
    // Use the existing 64 GB fallback only when the value is missing.
    const configuredStorageCapacityGB = this.mission?.spacecraft?.computing?.storageCapacityGB;
    const parsedStorageCapacityGB = configuredStorageCapacityGB == null
      ? 64
      : Number(configuredStorageCapacityGB);

    const storageCapacityGB = Number.isFinite(parsedStorageCapacityGB) && parsedStorageCapacityGB >= 0
      ? parsedStorageCapacityGB
      : 0;

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
      batteryEnergyWh: totalBatteryCapacityWh, // Starts fully charged when a battery is installed
      batteryCapacityWh: totalBatteryCapacityWh,
      batteryPercent: totalBatteryCapacityWh > 0 ? 100 : 0,

      // Data & Storage
      onboardStoredDataMB: 0,
      maxStorageMB: storageCapacityGB * 1024,
      totalDataCollectedMB: 0,
      totalDataDownlinkedMB: 0,
      totalDataDroppedMB: 0,
      storageOverflowAlerted: false,

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
      // Solar arrays are assumed stowed under the launch vehicle fairing.
      // An RTG, however, can provide continuous power during launch.
      this.state.currentPowerGenerationW = this.mission?.spacecraft?.power?.isRTG
        ? powerConfig.eclipseGenerationW
        : 0;
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

    // Keep battery energy within its installed capacity.
    // A spacecraft with no battery stores no energy, even if its power
    // source generates a surplus (for example, an RTG-powered spacecraft).
    if (this.state.batteryCapacityWh > 0) {
      this.state.batteryEnergyWh = Math.max(
        0,
        Math.min(this.state.batteryCapacityWh, this.state.batteryEnergyWh + netEnergyWh)
      );

      this.state.batteryPercent = Math.min(
        100,
        Math.max(0, (this.state.batteryEnergyWh / this.state.batteryCapacityWh) * 100)
      );
    } else {
      this.state.batteryEnergyWh = 0;
      this.state.batteryPercent = 0;
    }

    // A depleted or absent battery is only fatal when available generation
    // cannot support the current spacecraft load. This allows an adequately
    // sized RTG to operate through eclipse without a battery.
    const powerDeficitW =
      this.state.currentPowerConsumptionW - this.state.currentPowerGenerationW;

    const batteryUnavailableOrDepleted =
      this.state.batteryCapacityWh <= 0 || this.state.batteryEnergyWh <= 0;

    const spacecraftHasPowerShortfall =
      powerDeficitW > 1e-9 && batteryUnavailableOrDepleted;

    if (spacecraftHasPowerShortfall) {
      this.state.status = SIMULATION_PHASES.FAILED;
      this.state.failureReason =
        `Available generation (${this.state.currentPowerGenerationW.toFixed(1)} W) and stored battery energy (${this.state.batteryEnergyWh.toFixed(1)} Wh) cannot support the current load (${this.state.currentPowerConsumptionW.toFixed(1)} W).`;
      this.logEvent('CRITICAL', 'POWER LOSS', this.state.failureReason);
      this.evaluateFinalScore();
      return this.state;
    }

    // 4. Ground Station Contact Window Evaluation
    this.updateGroundStationContact();

    // 5. Scientific Data Generation & Downlink
    if (this.state.status === SIMULATION_PHASES.PRIMARY_OPS) {
      const dataDutyCycleFraction = 0.6;
      const dataCalc = calculateDataBudget({
        instruments: this.mission?.spacecraft?.instruments || [],
        computing: this.mission?.spacecraft?.computing,
        dutyCycleFraction: dataDutyCycleFraction,
      });

      // Apply the same validated duty cycle used by the data calculator.
      // effectiveRateMBps is the compressed data rate in MB/s.
      const effectiveDataRateMBps = Number(dataCalc.effectiveRateMBps);
      const validatedDutyCycle = Number(dataCalc.dutyCycleFraction);
      const safeDataRateMBps = Number.isFinite(effectiveDataRateMBps) && effectiveDataRateMBps > 0
        ? effectiveDataRateMBps
        : 0;
      const safeDutyCycle = Number.isFinite(validatedDutyCycle)
        ? Math.min(1, Math.max(0, validatedDutyCycle))
        : 0;

      // Average generated data for this simulation tick (MB).
      const dataGenTickMB = safeDataRateMBps * dt * safeDutyCycle;
      this.state.totalDataCollectedMB += dataGenTickMB;

      // Store only the amount that fits in the remaining onboard capacity.
      // Any excess is explicitly recorded as dropped scientific data.
      const availableStorageMB = Math.max(
        0,
        this.state.maxStorageMB - this.state.onboardStoredDataMB
      );
      const acceptedDataMB = Math.min(dataGenTickMB, availableStorageMB);
      const droppedDataMB = Math.max(0, dataGenTickMB - acceptedDataMB);

      this.state.onboardStoredDataMB += acceptedDataMB;
      this.state.totalDataDroppedMB += droppedDataMB;

      if (droppedDataMB > 0 && !this.state.storageOverflowAlerted) {
        this.logEvent(
          'WARNING',
          'DATA STORAGE OVERFLOW',
          `Onboard storage is full. ${droppedDataMB.toFixed(2)} MB of newly generated science data could not be stored.`
        );
        this.state.storageOverflowAlerted = true;
      }

      // Downlink execution if contacting a ground station.
      if (this.state.isContactingGroundStation) {
        const commsCalc = calculateCommunicationsBudget({
          comms: this.mission?.spacecraft?.comms,
          bodyId: this.mission?.destination,
          altitudeKm: this.orbitCalc.altitudeKm,
        });

        const reportedDownlinkRateMbps = Number(commsCalc.effectiveDownlinkRateMbps);
        const safeDownlinkRateMbps = Number.isFinite(reportedDownlinkRateMbps) && reportedDownlinkRateMbps > 0
          ? reportedDownlinkRateMbps
          : 0;
        const reportedDownlinkRateMBps = Number(commsCalc.effectiveDownlinkRateMBps);
        const safeDownlinkRateMBps = Number.isFinite(reportedDownlinkRateMBps) && reportedDownlinkRateMBps > 0
          ? reportedDownlinkRateMBps
          : 0;

        this.state.currentDownlinkRateMbps = safeDownlinkRateMbps;

        const downlinkCapacityMB = safeDownlinkRateMBps * dt;
        const actualDownlinkedMB = Math.min(
          this.state.onboardStoredDataMB,
          downlinkCapacityMB
        );

        this.state.onboardStoredDataMB = Math.max(
          0,
          this.state.onboardStoredDataMB - actualDownlinkedMB
        );
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
      totalDataCollectedMB: Number(this.state.totalDataCollectedMB.toFixed(2)),
      totalDataDroppedMB: Number(this.state.totalDataDroppedMB.toFixed(2)),
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
