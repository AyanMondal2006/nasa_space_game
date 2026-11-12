
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { persistenceService } from '../src/services/persistenceService.js';
import { exportService } from '../src/services/exportService.js';

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },

    setItem(key, value) {
      store.set(key, String(value));
    },

    removeItem(key) {
      store.delete(key);
    },

    clear() {
      store.clear();
    },
  };
}

function createTestMission() {
  return {
    id: 'mission-test-001',
    title: 'Test Lunar Mission',
    destination: 'moon',
    scenarioId: 'lunar-scout',
    spacecraft: {
      bus: { name: 'Test Bus', massKg: 100 },
      power: { name: 'Solar Array', generationW: 500 },
      battery: { capacityWh: 1000 },
      instruments: [{ id: 'camera-01', massKg: 10 }],
    },
    launchVehicle: {
      name: 'Test Launch Vehicle',
      payloadCapacityKg: 500,
    },
  };
}

describe('ASTRAJECT Mission Persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and retrieves a mission', () => {
    const mission = createTestMission();

    expect(persistenceService.saveMission(mission)).toBe(true);

    const saved = persistenceService.getSavedMissions();

    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(mission.id);
    expect(saved[0].title).toBe(mission.title);
    expect(saved[0].schemaVersion).toBe(1);
    expect(saved[0].savedAt).toBeTruthy();
  });

  it('updates an existing mission instead of creating duplicates', () => {
    const mission = createTestMission();

    persistenceService.saveMission(mission);

    const updatedMission = {
      ...mission,
      title: 'Updated Lunar Mission',
    };

    expect(persistenceService.saveMission(updatedMission)).toBe(true);

    const saved = persistenceService.getSavedMissions();

    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('Updated Lunar Mission');
  });

  it('creates an independent duplicate with a new ID', () => {
    const mission = createTestMission();

    persistenceService.saveMission(mission);

    const duplicate = persistenceService.duplicateMission(mission.id);

    expect(duplicate).not.toBeNull();
    expect(duplicate.id).not.toBe(mission.id);

    duplicate.spacecraft.bus.massKg = 999;

    expect(mission.spacecraft.bus.massKg).toBe(100);

    let saved = persistenceService.getSavedMissions();

    const original = saved.find(item => item.id === mission.id);
    const storedDuplicate = saved.find(item => item.id === duplicate.id);

    expect(original.spacecraft.bus.massKg).toBe(100);
    expect(storedDuplicate.spacecraft.bus.massKg).toBe(100);

    expect(persistenceService.saveMission(duplicate)).toBe(true);

    saved = persistenceService.getSavedMissions();

    const updatedCopy = saved.find(item => item.id === duplicate.id);

    expect(updatedCopy.spacecraft.bus.massKg).toBe(999);
    expect(saved).toHaveLength(2);
  });

  it('deletes a saved mission', () => {
    const mission = createTestMission();

    persistenceService.saveMission(mission);

    expect(persistenceService.deleteMission(mission.id)).toBe(true);
    expect(persistenceService.getSavedMissions()).toHaveLength(0);
  });

  it('persists and retrieves the active mission draft', () => {
    const mission = createTestMission();

    expect(persistenceService.setActiveMission(mission)).toBe(true);

    const restored = persistenceService.getActiveMission();

    expect(restored).toEqual(mission);
  });

  it('rejects saving a mission without an ID', () => {
    const mission = createTestMission();
    delete mission.id;

    expect(persistenceService.saveMission(mission)).toBe(false);
    expect(persistenceService.getSavedMissions()).toHaveLength(0);
  });
});

describe('ASTRAJECT Mission Import Validation', () => {
  it('accepts a valid ASTRAJECT mission export', () => {
    const mission = createTestMission();

    const exportData = {
      app: 'ASTRAJECT',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      mission,
    };

    const result = exportService.validateImportedJSON(
      JSON.stringify(exportData)
    );

    expect(result.isValid).toBe(true);
    expect(result.mission.id).toBe(mission.id);
    expect(result.mission.destination).toBe('moon');
  });

  it('accepts a valid raw mission configuration', () => {
    const mission = createTestMission();

    const result = exportService.validateImportedJSON(
      JSON.stringify(mission)
    );

    expect(result.isValid).toBe(true);
    expect(result.mission.title).toBe(mission.title);
  });

  it('rejects malformed JSON', () => {
    const result = exportService.validateImportedJSON(
      '{"mission": invalid json}'
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects JSON without mission identification', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        spacecraft: {},
        destination: 'moon',
      })
    );

    expect(result.isValid).toBe(false);
  });

  it('rejects a mission without spacecraft or destination configuration', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        id: 'invalid-mission',
        title: 'Incomplete Mission',
      })
    );

    expect(result.isValid).toBe(false);
  });

  it('rejects a mission with spacecraft but no destination', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        id: 'invalid-mission',
        title: 'Incomplete Mission',
        spacecraft: {},
      })
    );

    expect(result.isValid).toBe(false);
  });

  it('rejects a mission with destination but no spacecraft object', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        id: 'invalid-mission',
        title: 'Incomplete Mission',
        destination: 'moon',
      })
    );

    expect(result.isValid).toBe(false);
  });

  it('rejects an array used as the spacecraft configuration', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        id: 'invalid-mission',
        title: 'Invalid Spacecraft',
        destination: 'moon',
        spacecraft: [],
      })
    );

    expect(result.isValid).toBe(false);
  });

  it('rejects instruments when the instruments field is not an array', () => {
    const result = exportService.validateImportedJSON(
      JSON.stringify({
        id: 'invalid-mission',
        title: 'Invalid Payload',
        destination: 'moon',
        spacecraft: {
          bus: {},
          instruments: {},
        },
      })
    );

    expect(result.isValid).toBe(false);
  });
});
