
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

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
    id: 'mission-roundtrip-001',
    title: 'Lunar Research Mission',
    destination: 'moon',
    scenarioId: 'lunar-scout',

    spacecraft: {
      bus: {
        name: 'Deep Space Bus',
        massKg: 150,
      },

      power: {
        name: 'Solar Array',
        generationW: 750,
      },

      battery: {
        capacityWh: 1200,
      },

      instruments: [
        {
          id: 'spectrometer-01',
          massKg: 25,
          powerConsumptionW: 80,
        },
      ],
    },

    orbit: {
      altitudeKm: 100,
      inclinationDeg: 45,
    },

    launchVehicle: {
      name: 'Test Launch Vehicle',
      payloadCapacityKg: 500,
    },
  };
}

function mockDownloadEnvironment() {
  let capturedBlob = null;

  const link = {
    href: '',
    download: '',
    click: vi.fn(),
  };

  const createObjectURL = vi.fn(blob => {
    capturedBlob = blob;
    return 'blob:astraject-test';
  });

  const revokeObjectURL = vi.fn();

  vi.stubGlobal('URL', {
    createObjectURL,
    revokeObjectURL,
  });

  vi.stubGlobal('document', {
    createElement: vi.fn(() => link),

    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  });

  return {
    getBlob: () => capturedBlob,
    link,
    createObjectURL,
    revokeObjectURL,
  };
}

describe('ASTRAJECT Persistence Failure Handling', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns false when mission saving fails because storage is unavailable', () => {
    const mission = createTestMission();

    localStorage.setItem = () => {
      throw new Error('Quota exceeded');
    };

    expect(persistenceService.saveMission(mission)).toBe(false);
  });

  it('returns false when active mission persistence fails', () => {
    const mission = createTestMission();

    localStorage.setItem = () => {
      throw new Error('Storage unavailable');
    };

    expect(persistenceService.setActiveMission(mission)).toBe(false);
  });

  it('returns false when deleting a mission cannot be persisted', () => {
    const mission = createTestMission();

    localStorage.setItem = () => {};
    expect(persistenceService.saveMission(mission)).toBe(true);

    localStorage.setItem = () => {
      throw new Error('Storage unavailable');
    };

    expect(persistenceService.deleteMission(mission.id)).toBe(false);
  });

  it('recovers safely when saved mission JSON is corrupted', () => {
    localStorage.setItem(
      'astraject_v1_missions',
      '{invalid json'
    );

    expect(persistenceService.getSavedMissions()).toEqual([]);
  });
});

describe('ASTRAJECT Export Integrity', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports a complete mission that can be imported without configuration loss', async () => {
    const mission = createTestMission();

    const download = mockDownloadEnvironment();

    exportService.exportMissionJSON(mission);

    expect(download.getBlob()).not.toBeNull();
    expect(download.link.click).toHaveBeenCalledOnce();
    expect(download.createObjectURL).toHaveBeenCalledOnce();
    expect(download.revokeObjectURL).toHaveBeenCalledOnce();

    const exportedText = await download.getBlob().text();
    const exportedData = JSON.parse(exportedText);

    expect(exportedData.app).toBe('ASTRAJECT');
    expect(exportedData.version).toBe('1.0.0');
    expect(exportedData.mission).toEqual(mission);

    const importResult = exportService.validateImportedJSON(
      exportedText
    );

    expect(importResult.isValid).toBe(true);
    expect(importResult.mission).toEqual(mission);
  });

  it('generates a sanitized mission export filename', () => {
    const mission = createTestMission();
    mission.title = 'Lunar Mission: Test / Alpha';

    const download = mockDownloadEnvironment();

    exportService.exportMissionJSON(mission);

    expect(download.link.download).toMatch(
      /^astraject_lunar_mission_test_alpha_\d+\.json$/
    );
  });

  it('exports telemetry CSV with correctly escaped MET values', async () => {
    const download = mockDownloadEnvironment();

    const telemetry = [
      {
        timeSeconds: 60,
        timeFormatted: 'MET "T+1"',
        powerGenerationW: 500,
        powerConsumptionW: 250,
        batteryPercent: 90,
        batteryEnergyWh: 1080,
        storedDataMB: 120,
        downlinkMbps: 10,
        totalDownlinkedGB: 0.5,
        isInEclipse: true,
        hasContact: false,
      },
    ];

    exportService.exportTelemetryCSV(
      telemetry,
      'Lunar Mission'
    );

    expect(download.getBlob()).not.toBeNull();

    const csv = await download.getBlob().text();

    expect(csv).toContain('TimeSeconds,MET,PowerGenW');
    expect(csv).toContain('"MET ""T+1"""');
    expect(csv).toContain('500,250');
    expect(csv).toContain(',1,0');
    expect(download.link.click).toHaveBeenCalledOnce();
  });

  it('does not attempt to export empty telemetry history', () => {
    const download = mockDownloadEnvironment();

    exportService.exportTelemetryCSV([], 'Empty Mission');

    expect(download.getBlob()).toBeNull();
    expect(download.link.click).not.toHaveBeenCalled();
  });
});
