/**
 * Space Mission Deep-Link Sharing Service
 * Encodes & decodes mission configurations into compact URL hash strings
 * allowing instant peer-to-peer design sharing without a backend database.
 */

export const shareService = {
  encodeMission(mission) {
    if (!mission) return '';
    try {
      const stripped = {
        title: mission.title,
        scenarioId: mission.scenarioId,
        category: mission.category,
        destination: mission.destination,
        budgetLimitUSD: mission.budgetLimitUSD,
        durationDays: mission.durationDays,
        campaignDifficulty: mission.campaignDifficulty,
        gameplayDifficulty: mission.gameplayDifficulty,
        deltaVRequiredMs: mission.deltaVRequiredMs,
        spacecraft: {
          busId: mission.spacecraft?.bus?.id,
          powerId: mission.spacecraft?.power?.id,
          batteryId: mission.spacecraft?.battery?.id,
          instrumentIds: mission.spacecraft?.instruments?.map(i => i.id) || [],
          commsId: mission.spacecraft?.comms?.id,
          adcsId: mission.spacecraft?.adcs?.id,
          computingId: mission.spacecraft?.computing?.id,
          thermalId: mission.spacecraft?.thermal?.id,
          propulsionId: mission.spacecraft?.propulsion?.id,
          propellantLoadKg: mission.spacecraft?.propulsion?.initialPropellantKg,
        },
        launchVehicleId: mission.launchVehicle?.id,
        orbitId: mission.orbit?.id,
        sharedAt: Date.now(),
      };

      const jsonStr = JSON.stringify(stripped);
      const encoded = btoa(encodeURIComponent(jsonStr));
      return encoded;
    } catch (err) {
      console.error('Failed to encode mission to URL hash:', err);
      return '';
    }
  },

  decodeMission(hashStr) {
    if (!hashStr) return null;
    try {
      let raw = hashStr;
      if (raw.startsWith('#mission=')) {
        raw = raw.replace('#mission=', '');
      } else if (raw.startsWith('#')) {
        raw = raw.slice(1);
      }
      if (!raw) return null;

      const decodedJson = decodeURIComponent(atob(raw));
      const parsed = JSON.parse(decodedJson);
      if (!parsed || !parsed.title || !parsed.spacecraft) {
        return null;
      }
      return parsed;
    } catch (err) {
      console.warn('URL hash did not contain a valid mission payload:', err);
      return null;
    }
  },

  generateShareUrl(mission) {
    const payload = this.encodeMission(mission);
    if (!payload) return window.location.href;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#mission=${payload}`;
  },

  async copyShareUrlToClipboard(mission) {
    const url = this.generateShareUrl(mission);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return { success: true, url };
      } else {
        // Fallback for older browsers
        const input = document.createElement('textarea');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        return { success: true, url };
      }
    } catch (err) {
      console.error('Failed to copy share link:', err);
      return { success: false, url, error: err.message };
    }
  },
};

