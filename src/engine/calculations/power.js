
/**
 * Spacecraft Power & Energy Balance Engine
 *
 * Evaluates:
 * 1. Power generation (Watts)
 * 2. Subsystem power consumption (Watts)
 * 3. Daylight and eclipse energy balance (Watt-hours)
 * 4. Battery Depth of Discharge (DoD)
 * 5. Battery recharge capability
 * 6. Power-system feasibility
 *
 * This is a simplified educational engineering model.
 */

import { CELESTIAL_BODIES } from '../constants/physics.js';

export const MAX_RECOMMENDED_DOD = 0.70;

const DEFAULT_ORBITAL_PERIOD_SEC = 5400;
const DEFAULT_ECLIPSE_FRACTION = 0.37;
const COMMUNICATION_STANDBY_FRACTION = 0.30;
const INSTRUMENT_ECLIPSE_LOAD_FRACTION = 0.70;


/**
 * Safely converts a value into a non-negative finite number.
 *
 * Missing values use the supplied fallback.
 * Invalid or negative values are replaced by the fallback
 * and reported through the issues array.
 */
function readNonNegative(value, label, issues, fallback = 0) {

    if (value === undefined || value === null) {
        return fallback;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {

        issues.push(
            `Invalid ${label}. Expected a finite non-negative number. Using ${fallback}.`
        );

        return fallback;
    }

    return number;
}


/**
 * Calculates spacecraft power generation, consumption
 * and orbital energy balance.
 *
 * @param {object} params
 * @param {object} params.powerSource
 * @param {object} params.battery
 * @param {Array} params.instruments
 * @param {object} params.comms
 * @param {object} params.adcs
 * @param {object} params.computing
 * @param {object} params.thermal
 * @param {object} params.orbit
 * @param {string} params.bodyId
 *
 * @returns {object} Power budget and energy balance metrics
 */

export function calculatePowerBudget({
    powerSource,
    battery,
    instruments = [],
    comms,
    adcs,
    computing,
    thermal,
    orbit,
    bodyId = 'earth',
}) {

    const issues = [];

    // --------------------------------------------------
    // 1. CELESTIAL BODY AND SOLAR DISTANCE
    // --------------------------------------------------

    const body =
        CELESTIAL_BODIES[bodyId] ||
        CELESTIAL_BODIES.earth;

    const bodySolarDistance = Number(body?.solarDistanceAU);

    const solarDistanceAU =
        Number.isFinite(bodySolarDistance) && bodySolarDistance > 0
            ? bodySolarDistance
            : 1.0;


    // --------------------------------------------------
    // 2. POWER GENERATION
    // --------------------------------------------------

    const isRTG = Boolean(powerSource?.isRTG);

    const nominalPowerW = readNonNegative(
        powerSource?.generationW,
        'power generation',
        issues
    );

    let daylightGenerationW = 0;
    let eclipseGenerationW = 0;

    if (isRTG) {

        // RTG supplies power continuously,
        // both in sunlight and during eclipse.

        daylightGenerationW = nominalPowerW;
        eclipseGenerationW = nominalPowerW;

    } else {

        // Solar power follows the inverse-square law.

        const distanceFactor =
            1 / Math.pow(solarDistanceAU, 2);

        daylightGenerationW =
            nominalPowerW * distanceFactor;

        // Solar arrays cannot generate power
        // while the spacecraft is in planetary shadow.

        eclipseGenerationW = 0;
    }


    // --------------------------------------------------
    // 3. SUBSYSTEM POWER CONSUMPTION
    // --------------------------------------------------

    const computingPowerW = readNonNegative(
        computing?.powerConsumptionW,
        'computing power consumption',
        issues
    );

    const adcsPowerW = readNonNegative(
        adcs?.powerConsumptionW,
        'ADCS power consumption',
        issues
    );

    const thermalPowerW = readNonNegative(
        thermal?.powerConsumptionW,
        'thermal power consumption',
        issues
    );

    const commsTransmitPowerW = readNonNegative(
        comms?.powerConsumptionW,
        'communication power consumption',
        issues
    );

    const commsStandbyPowerW =
        commsTransmitPowerW * COMMUNICATION_STANDBY_FRACTION;


    // Base spacecraft load excluding communication hardware.

    const busWithoutCommsW =
        computingPowerW +
        adcsPowerW +
        thermalPowerW;


    // Base spacecraft load including communication standby.

    const busBasePowerW =
        busWithoutCommsW +
        commsStandbyPowerW;


    // --------------------------------------------------
    // 4. SCIENTIFIC INSTRUMENT POWER
    // --------------------------------------------------

    if (!Array.isArray(instruments)) {

        issues.push(
            'Invalid instruments configuration. Expected an array.'
        );

        instruments = [];
    }

    const instrumentsPowerW = instruments.reduce(
        (total, instrument, index) => {

            const instrumentPower = readNonNegative(
                instrument?.powerConsumptionW,
                `instrument ${index + 1} power consumption`,
                issues
            );

            return total + instrumentPower;

        },
        0
    );


    // --------------------------------------------------
    // 5. OPERATIONAL POWER MODES
    // --------------------------------------------------

    // Mode A: Daylight scientific observation.

    const daylightLoadW =
        busBasePowerW +
        instrumentsPowerW;


    // Mode B: Peak communication transmission.
    //
    // Replace communication standby consumption with
    // full transmitter consumption.
    //
    // Do not count standby and transmission simultaneously.

    const peakLoadW =
        busWithoutCommsW +
        instrumentsPowerW +
        commsTransmitPowerW;


    // Mode C: Eclipse survival.
    //
    // Scientific instruments operate at 70% load.

    const eclipseLoadW =
        busBasePowerW +
        (instrumentsPowerW * INSTRUMENT_ECLIPSE_LOAD_FRACTION);


    // Net eclipse power requirement after RTG contribution.

    const eclipseNetLoadW = Math.max(
        0,
        eclipseLoadW - eclipseGenerationW
    );


    // --------------------------------------------------
    // 6. ORBITAL TIME PARAMETERS
    // --------------------------------------------------

    let orbitalPeriodSec = readNonNegative(
        orbit?.periodSeconds,
        'orbital period',
        issues,
        DEFAULT_ORBITAL_PERIOD_SEC
    );

    if (orbitalPeriodSec <= 0) {

        issues.push(
            'Orbital period must be greater than zero. Using the default 5400 seconds.'
        );

        orbitalPeriodSec = DEFAULT_ORBITAL_PERIOD_SEC;
    }


    // Eclipse duration.

    let eclipseDurationSec;

    if (orbit?.maxEclipseDurationSeconds == null) {

        eclipseDurationSec =
            orbitalPeriodSec * DEFAULT_ECLIPSE_FRACTION;

    } else {

        eclipseDurationSec = readNonNegative(
            orbit.maxEclipseDurationSeconds,
            'maximum eclipse duration',
            issues
        );
    }


    // Eclipse duration cannot exceed orbital period.

    if (eclipseDurationSec > orbitalPeriodSec) {

        issues.push(
            'Eclipse duration exceeds orbital period. Eclipse duration has been limited to the orbital period.'
        );

        eclipseDurationSec = orbitalPeriodSec;
    }


    const daylightDurationSec =
        orbitalPeriodSec - eclipseDurationSec;

    const eclipseDurationHours =
        eclipseDurationSec / 3600;

    const daylightDurationHours =
        daylightDurationSec / 3600;


    // --------------------------------------------------
    // 7. ECLIPSE ENERGY REQUIREMENT
    // --------------------------------------------------

    const energyConsumedEclipseWh =
        eclipseNetLoadW * eclipseDurationHours;


    // --------------------------------------------------
    // 8. BATTERY CAPACITY AND DEPTH OF DISCHARGE
    // --------------------------------------------------

    const totalBatteryCapacityWh = readNonNegative(
        battery?.capacityWh,
        'battery capacity',
        issues
    );


    // Recommended usable battery capacity.

    const usableBatteryCapacityWh =
        totalBatteryCapacityWh * MAX_RECOMMENDED_DOD;


    // A missing battery is critical only when
    // eclipse operations actually require stored energy.

    const batteryCapacityUnavailable =
        totalBatteryCapacityWh <= 0 &&
        energyConsumedEclipseWh > 0;


    /*
     * Depth of Discharge:
     *
     * DoD = Eclipse Energy Required / Installed Battery Capacity
     *
     * When battery capacity is zero and energy is required,
     * the ratio is Infinity.
     *
     * This also preserves compatibility with the existing
     * validation engine, which checks whether dodReached > 1.
     */

    let dodReached;

    if (totalBatteryCapacityWh > 0) {

        dodReached =
            energyConsumedEclipseWh / totalBatteryCapacityWh;

    } else if (batteryCapacityUnavailable) {

        dodReached = Infinity;

    } else {

        dodReached = 0;
    }

    const dodPercent = dodReached * 100;


    // --------------------------------------------------
    // 9. DAYLIGHT ENERGY GENERATION AND SURPLUS
    // --------------------------------------------------

    const energyGeneratedDaylightWh =
        daylightGenerationW * daylightDurationHours;


    // Daylight power available after spacecraft loads.

    const netDaylightPowerMarginW =
        daylightGenerationW - daylightLoadW;


    // Net energy available during daylight.

    const energySurplusDaylightWh =
        netDaylightPowerMarginW * daylightDurationHours;


    // --------------------------------------------------
    // 10. BATTERY RECHARGEMENT CAPABILITY
    // --------------------------------------------------

    const availableRechargeEnergyWh = Math.max(
        0,
        energySurplusDaylightWh
    );

    const canRechargeBattery =
        energyConsumedEclipseWh === 0 ||
        availableRechargeEnergyWh >= energyConsumedEclipseWh;


    const rechargeRatio =
        energyConsumedEclipseWh > 0
            ? energySurplusDaylightWh / energyConsumedEclipseWh
            : 1.0;


    // --------------------------------------------------
    // 11. DAYLIGHT POWER MARGINS
    // --------------------------------------------------

    const daylightPowerMarginW =
        daylightGenerationW - daylightLoadW;

    const daylightPowerMarginPercent =
        daylightLoadW > 0
            ? (daylightPowerMarginW / daylightLoadW) * 100
            : 0;


    // --------------------------------------------------
    // 12. POWER SYSTEM STATUS DIAGNOSIS
    // --------------------------------------------------

    // Invalid engineering inputs are treated as critical
    // configuration errors rather than silently accepted.

    let status =
        issues.length > 0 ? 'critical' : 'optimal';


    // A. Daylight power generation failure.

    if (daylightPowerMarginW < 0) {

        status = 'critical';

        issues.push(
            `Power generation (${daylightGenerationW.toFixed(1)} W) is insufficient for daytime spacecraft loads (${daylightLoadW.toFixed(1)} W).`
        );
    }


    // B. Missing battery with positive eclipse energy demand.

    if (batteryCapacityUnavailable) {

        status = 'critical';

        issues.push(
            `Battery capacity is zero, but eclipse operations require ${energyConsumedEclipseWh.toFixed(2)} Wh of stored energy.`
        );

    } else if (dodReached > 1.0) {

        // C. Battery completely depleted during eclipse.

        status = 'critical';

        issues.push(
            `Battery depleted during eclipse! Required: ${energyConsumedEclipseWh.toFixed(2)} Wh, Installed: ${totalBatteryCapacityWh.toFixed(2)} Wh. Depth of Discharge: ${dodPercent.toFixed(1)}%.`
        );

    } else if (dodReached > MAX_RECOMMENDED_DOD) {

        // D. Battery exceeds recommended DoD.

        if (status !== 'critical') {
            status = 'warning';
        }

        issues.push(
            `Battery Depth of Discharge (${dodPercent.toFixed(1)}%) exceeds recommended threshold (${(MAX_RECOMMENDED_DOD * 100).toFixed(0)}%).`
        );
    }


    // E. Insufficient daylight energy for battery recovery.

    if (!canRechargeBattery && energyConsumedEclipseWh > 0) {

        if (status !== 'critical') {
            status = 'warning';
        }

        issues.push(
            `Daylight energy surplus (${energySurplusDaylightWh.toFixed(2)} Wh) cannot fully replenish eclipse energy consumption (${energyConsumedEclipseWh.toFixed(2)} Wh). Net orbital energy deficit.`
        );
    }


    // --------------------------------------------------
    // 13. FINAL POWER BUDGET RESULT
    // --------------------------------------------------

    return {

        // Power generation.

        daylightGenerationW,
        eclipseGenerationW,
        solarDistanceAU,

        // Power consumption.

        busBasePowerW,
        instrumentsPowerW,

        daylightLoadW,
        peakLoadW,
        eclipseLoadW,
        eclipseNetLoadW,

        // Power margins.

        daylightPowerMarginW,
        daylightPowerMarginPercent,

        // Orbital parameters.

        orbitalPeriodSec,
        daylightDurationSec,
        eclipseDurationSec,
        daylightDurationHours,
        eclipseDurationHours,

        // Energy metrics.

        energyConsumedEclipseWh,
        energyGeneratedDaylightWh,
        energySurplusDaylightWh,

        // Battery metrics.

        totalBatteryCapacityWh,
        usableBatteryCapacityWh,
        batteryCapacityUnavailable,

        dodReached,
        dodPercent,

        // Recharge metrics.

        canRechargeBattery,
        rechargeRatio,

        // Final diagnosis.

        status,
        issues,

        // Power consumption breakdown.

        breakdown: [

            {
                name: 'Onboard Computing',
                watts: computingPowerW
            },

            {
                name: 'ADCS / Pointing',
                watts: adcsPowerW
            },

            {
                name: 'Thermal Heaters',
                watts: thermalPowerW
            },

            {
                name: 'Communications (Standby)',
                watts: commsStandbyPowerW
            },

            {
                name: 'Communications (Peak Transmission)',
                watts: commsTransmitPowerW
            },

            {
                name: 'Scientific Payload',
                watts: instrumentsPowerW
            }

        ]
    };
}
