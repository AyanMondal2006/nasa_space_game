
/**
 * Mission Export & Import Service
 *
 * Exports mission configuration as validated JSON,
 * telemetry history as CSV, and validates imported JSON files.
 */

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Converts titles into consistent, filesystem-friendly filenames.
function sanitizeFileName(value, fallback = 'mission') {
  const sanitized = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || fallback;
}

export const exportService = {
  exportMissionJSON(mission) {
    if (!mission || !isPlainObject(mission)) return;

    const exportData = {
      app: 'ASTRAJECT',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      mission,
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeName = sanitizeFileName(mission.title);

    link.href = url;
    link.download = `astraject_${safeName}_${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },

  exportTelemetryCSV(telemetryHistory, missionTitle = 'telemetry') {
    if (!Array.isArray(telemetryHistory) || telemetryHistory.length === 0) {
      return;
    }

    const headers = [
      'TimeSeconds',
      'MET',
      'PowerGenW',
      'PowerConsW',
      'BatteryPercent',
      'BatteryEnergyWh',
      'StoredDataMB',
      'DownlinkMbps',
      'TotalDownlinkedGB',
      'IsInEclipse',
      'HasContact',
    ];

    const rows = telemetryHistory.map(row => [
      row.timeSeconds,
      `"${String(row.timeFormatted || '').replace(/"/g, '""')}"`,
      row.powerGenerationW,
      row.powerConsumptionW,
      row.batteryPercent,
      row.batteryEnergyWh,
      row.storedDataMB,
      row.downlinkMbps,
      row.totalDownlinkedGB,
      row.isInEclipse ? 1 : 0,
      row.hasContact ? 1 : 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeName = sanitizeFileName(missionTitle, 'telemetry');

    link.href = url;
    link.download = `astraject_${safeName}_telemetry.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },

  validateImportedJSON(rawText) {
    try {
      const parsed = JSON.parse(rawText);

      if (!isPlainObject(parsed)) {
        return {
          isValid: false,
          error: 'Imported file must contain a valid JSON object.',
        };
      }

      const mission = Object.prototype.hasOwnProperty.call(parsed, 'mission')
        ? parsed.mission
        : parsed;

      if (!isPlainObject(mission)) {
        return {
          isValid: false,
          error: 'Imported mission configuration must be a JSON object.',
        };
      }

      const hasValidId = isNonEmptyString(mission.id);
      const hasValidTitle = isNonEmptyString(mission.title);

      if (!hasValidId && !hasValidTitle) {
        return {
          isValid: false,
          error: 'Imported JSON is missing mission identifier or title.',
        };
      }

      if (!isNonEmptyString(mission.destination)) {
        return {
          isValid: false,
          error: 'Mission destination is missing or invalid.',
        };
      }

      if (!isPlainObject(mission.spacecraft)) {
        return {
          isValid: false,
          error: 'Mission spacecraft configuration must be a valid object.',
        };
      }

      if (
        Object.prototype.hasOwnProperty.call(
          mission.spacecraft,
          'instruments'
        ) &&
        !Array.isArray(mission.spacecraft.instruments)
      ) {
        return {
          isValid: false,
          error: 'Spacecraft instruments must be provided as an array.',
        };
      }

      const validatedMission = {
        ...mission,
        id: hasValidId
          ? mission.id
          : `mission-imported-${Date.now()}`,
        title: hasValidTitle
          ? mission.title
          : 'Imported Mission Design',
      };

      return {
        isValid: true,
        mission: validatedMission,
      };

    } catch (err) {
      return {
        isValid: false,
        error: `Malformed JSON file: ${err.message}`,
      };
    }
  },
};
