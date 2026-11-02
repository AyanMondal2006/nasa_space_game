/**
 * Mission Persistence Service (LocalStorage with schema versioning & fallback)
 * Stores saved missions, active mission drafts, and personal best scores.
 */

const STORAGE_KEY_MISSIONS = 'astraject_v1_missions';
const STORAGE_KEY_ACTIVE = 'astraject_v1_active_mission';
const STORAGE_KEY_SETTINGS = 'astraject_v1_settings';
const CURRENT_SCHEMA_VERSION = 1;

export const persistenceService = {
  getSavedMissions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MISSIONS) || localStorage.getItem('orbitforge_v1_missions');
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
      if (data.version && Array.isArray(data.missions)) return data.missions;
      return [];
    } catch (err) {
      console.error('Failed to load saved missions from localStorage:', err);
      return [];
    }
  },

  saveMission(mission) {
    if (!mission || !mission.id) return false;
    try {
      const missions = this.getSavedMissions();
      const existingIdx = missions.findIndex(m => m.id === mission.id);
      const missionToSave = {
        ...mission,
        savedAt: new Date().toISOString(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      if (existingIdx >= 0) {
        missions[existingIdx] = missionToSave;
      } else {
        missions.unshift(missionToSave);
      }

      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify({
        version: CURRENT_SCHEMA_VERSION,
        missions,
      }));
      return true;
    } catch (err) {
      console.error('Failed to save mission to localStorage:', err);
      return false;
    }
  },

  deleteMission(missionId) {
    try {
      const missions = this.getSavedMissions().filter(m => m.id !== missionId);
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify({
        version: CURRENT_SCHEMA_VERSION,
        missions,
      }));
      return true;
    } catch (err) {
      console.error('Failed to delete mission:', err);
      return false;
    }
  },

  duplicateMission(missionId) {
    try {
      const missions = this.getSavedMissions();
      const source = missions.find(m => m.id === missionId);
      if (!source) return null;

      const duplicated = {
        ...JSON.parse(JSON.stringify(source)),
        id: `mission-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `${source.title} (Copy)`,
        savedAt: new Date().toISOString(),
      };

      this.saveMission(duplicated);
      return duplicated;
    } catch (err) {
      console.error('Failed to duplicate mission:', err);
      return null;
    }
  },

  getActiveMission() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE) || localStorage.getItem('orbitforge_v1_active_mission');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('Failed to load active mission:', err);
      return null;
    }
  },

  setActiveMission(mission) {
    try {
      if (!mission) {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      } else {
        localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(mission));
      }
      return true;
    } catch (err) {
      console.error('Failed to set active mission:', err);
      return false;
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem('orbitforge_v1_settings');
      return raw ? JSON.parse(raw) : {
        soundEnabled: false,
        highContrast: false,
        reduceMotion: false,
        simulationDefaultSpeed: 1,
        units: 'SI',
      };
    } catch {
      return { soundEnabled: false, highContrast: false, simulationDefaultSpeed: 1 };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  },
};
