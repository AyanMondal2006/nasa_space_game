/**
 * Mission Export & Import Service
 * Exports mission configuration as validated JSON, telemetry history as CSV,
 * and validates user-imported JSON files.
 */

export const exportService = {
  exportMissionJSON(mission) {
    if (!mission) return;
    const exportData = {
      app: 'ASTRAJECT',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      mission,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (mission.title || 'mission').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `astraject_${safeName}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportTelemetryCSV(telemetryHistory, missionTitle = 'telemetry') {
    if (!telemetryHistory || telemetryHistory.length === 0) return;

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
      `"${row.timeFormatted || ''}"`,
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

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = missionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
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
      const mission = parsed.mission || parsed;

      if (!mission.id && !mission.title) {
        return {
          isValid: false,
          error: 'Imported JSON is missing mission identifier or title.',
        };
      }

      if (!mission.spacecraft && !mission.destination) {
        return {
          isValid: false,
          error: 'Imported JSON does not conform to ASTRAJECT mission schema.',
        };
      }

      return {
        isValid: true,
        mission: {
          ...mission,
          id: mission.id || `mission-imported-${Date.now()}`,
          title: mission.title || 'Imported Mission Design',
        },
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Malformed JSON file: ${err.message}`,
      };
    }
  },
};
