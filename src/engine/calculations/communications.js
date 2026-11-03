
/**
 * Space Communications & Downlink Engine
 *
 * Models:
 * 1. Communication subsystem bandwidth
 * 2. RF and optical communication configurations
 * 3. Destination-dependent rate attenuation
 * 4. Ground-station contact availability
 * 5. Signal propagation delay
 * 6. Daily downlink capacity
 * 7. Scientific data backlog
 * 8. Communication link health
 *
 * IMPORTANT:
 * This is a simplified educational game model.
 * Distance factors and contact durations are game assumptions,
 * not a complete RF or optical link-budget calculation.
 *
 * Units:
 * Mbps = Megabits per second
 * MB/s = Megabytes per second
 * MB = Binary Megabytes
 * GB = Binary Gigabytes
 */

import { CELESTIAL_BODIES } from '../constants/physics.js';


const DEFAULT_BANDWIDTH_MBPS = 0;
const DEFAULT_ALTITUDE_KM = 400;
const DEFAULT_DAILY_DATA_MB = 1000;

const MINIMUM_DOWNLINK_MARGIN_PERCENT = 20;


/**
 * Safely validates a non-negative numerical value.
 */
function readNonNegative(value, label, issues, fallback = 0) {

    if (value === undefined || value === null) {
        return fallback;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {

        issues.push(
            `Invalid ${label}. Expected a finite non-negative number.`
        );

        return fallback;
    }

    return number;
}


/**
 * Calculates communication performance, contact availability,
 * daily downlink capacity and communication backlog.
 *
 * @param {object} params
 * @param {object} params.comms Communication subsystem
 * @param {string} params.bodyId Target celestial body
 * @param {number} params.altitudeKm Orbital altitude
 * @param {number} params.dailyDataGeneratedMB Daily generated data
 * @param {number} params.contactMinutesPerDay Optional contact duration override
 *
 * @returns {object} Communication performance metrics
 */

export function calculateCommunicationsBudget({

    comms = null,

    bodyId = 'earth',

    altitudeKm = DEFAULT_ALTITUDE_KM,

    dailyDataGeneratedMB = DEFAULT_DAILY_DATA_MB,

    contactMinutesPerDay,

} = {}) {

    const issues = [];

    let configurationInvalid = false;


    // --------------------------------------------------
    // 1. VALIDATE COMMUNICATION HARDWARE
    // --------------------------------------------------

    let baseBandwidthMbps = DEFAULT_BANDWIDTH_MBPS;

    if (!comms || typeof comms !== 'object') {

        issues.push(
            'Communication subsystem is missing. No downlink hardware is configured.'
        );

    } else if (
        comms.bandwidthMbps === undefined ||
        comms.bandwidthMbps === null
    ) {

        issues.push(
            'Communication bandwidth is missing from the selected subsystem.'
        );

    } else {

        const configuredBandwidth = Number(
            comms.bandwidthMbps
        );

        if (
            !Number.isFinite(configuredBandwidth) ||
            configuredBandwidth < 0
        ) {

            issues.push(
                'Invalid communication bandwidth. Expected a finite non-negative value.'
            );

            configurationInvalid = true;

        } else {

            baseBandwidthMbps = configuredBandwidth;
        }
    }


    // --------------------------------------------------
    // 2. VALIDATE DESTINATION
    // --------------------------------------------------

    const supportedBodies = [
        'earth',
        'moon',
        'mars',
        'asteroid'
    ];

    let selectedBodyId = bodyId;

    if (!supportedBodies.includes(bodyId)) {

        issues.push(
            `Unsupported destination "${bodyId}". Earth fallback will be used.`
        );

        selectedBodyId = 'earth';

        configurationInvalid = true;
    }

    // Retain compatibility with the existing celestial-body catalog.

    const body =
        CELESTIAL_BODIES[selectedBodyId] ||
        CELESTIAL_BODIES.earth;


    // --------------------------------------------------
    // 3. VALIDATE ORBITAL ALTITUDE
    // --------------------------------------------------

    const validatedAltitudeKm = readNonNegative(
        altitudeKm,
        'orbital altitude',
        issues,
        DEFAULT_ALTITUDE_KM
    );

    if (
        altitudeKm !== undefined &&
        altitudeKm !== null &&
        (!Number.isFinite(Number(altitudeKm)) || Number(altitudeKm) < 0)
    ) {

        configurationInvalid = true;
    }


    // --------------------------------------------------
    // 4. VALIDATE DAILY DATA GENERATION
    // --------------------------------------------------

    const validatedDailyDataGeneratedMB = readNonNegative(
        dailyDataGeneratedMB,
        'daily data generation',
        issues,
        DEFAULT_DAILY_DATA_MB
    );

    if (
        dailyDataGeneratedMB !== undefined &&
        dailyDataGeneratedMB !== null &&
        (
            !Number.isFinite(Number(dailyDataGeneratedMB)) ||
            Number(dailyDataGeneratedMB) < 0
        )
    ) {

        configurationInvalid = true;
    }


    // --------------------------------------------------
    // 5. DETERMINE DESTINATION ATTENUATION AND CONTACT
    // --------------------------------------------------

    let distanceFactor = 1.0;

    let typicalContactMinutesPerDay = 120;

    let propagationDelaySeconds = 0.003;


    const isOptical = Boolean(comms?.isOptical);


    if (selectedBodyId === 'earth') {

        if (validatedAltitudeKm > 20000) {

            // GEO approximation.

            distanceFactor = 0.6;

            typicalContactMinutesPerDay = 1440;

            propagationDelaySeconds = 0.12;

        } else {

            // LEO approximation.

            distanceFactor = 1.0;

            typicalContactMinutesPerDay = 110;

            propagationDelaySeconds = 0.003;
        }

    } else if (selectedBodyId === 'moon') {

        distanceFactor = isOptical ? 0.6 : 0.25;

        typicalContactMinutesPerDay = 360;

        propagationDelaySeconds = 1.3;

    } else if (selectedBodyId === 'mars') {

        distanceFactor = isOptical ? 0.15 : 0.025;

        typicalContactMinutesPerDay = 240;

        propagationDelaySeconds = 780;

    } else if (selectedBodyId === 'asteroid') {

        distanceFactor = isOptical ? 0.08 : 0.015;

        typicalContactMinutesPerDay = 180;

        propagationDelaySeconds = 1400;
    }


    // --------------------------------------------------
    // 6. OPTIONAL GROUND-STATION CONTACT OVERRIDE
    // --------------------------------------------------

    if (contactMinutesPerDay !== undefined && contactMinutesPerDay !== null) {

        const configuredContactMinutes = Number(
            contactMinutesPerDay
        );

        if (
            !Number.isFinite(configuredContactMinutes) ||
            configuredContactMinutes < 0 ||
            configuredContactMinutes > 1440
        ) {

            issues.push(
                'Invalid ground-station contact duration. Expected a value between 0 and 1440 minutes.'
            );

            configurationInvalid = true;

            typicalContactMinutesPerDay = 0;

        } else {

            typicalContactMinutesPerDay =
                configuredContactMinutes;
        }
    }


    // --------------------------------------------------
    // 7. CALCULATE EFFECTIVE DOWNLINK RATE
    // --------------------------------------------------

    // No artificial minimum transmission rate.
    // Zero bandwidth must produce zero transmission capacity.

    const effectiveDownlinkRateMbps =
        baseBandwidthMbps * distanceFactor;


    // Mbps to MB/s conversion.

    const effectiveDownlinkRateMBps =
        (effectiveDownlinkRateMbps * 1e6) /
        (8 * 1024 * 1024);


    // --------------------------------------------------
    // 8. CALCULATE CONTACT TIME
    // --------------------------------------------------

    const contactSecondsPerDay =
        typicalContactMinutesPerDay * 60;


    // --------------------------------------------------
    // 9. DAILY DOWNLINK CAPACITY
    // --------------------------------------------------

    const dailyDownlinkCapacityMB =
        effectiveDownlinkRateMBps * contactSecondsPerDay;

    const dailyDownlinkCapacityGB =
        dailyDownlinkCapacityMB / 1024;


    // --------------------------------------------------
    // 10. DAILY DATA BALANCE
    // --------------------------------------------------

    // Positive value = data backlog increases.
    // Negative value = downlink capacity exceeds generation.
    // Zero = exact data-generation/downlink balance.

    const netDailyBacklogMB =
        validatedDailyDataGeneratedMB -
        dailyDownlinkCapacityMB;


    // --------------------------------------------------
    // 11. COMMUNICATION MARGIN
    // --------------------------------------------------

    const downlinkMarginPercent =
        validatedDailyDataGeneratedMB > 0

            ? (
                (dailyDownlinkCapacityMB -
                    validatedDailyDataGeneratedMB) /
                validatedDailyDataGeneratedMB
            ) * 100

            : 100;


    // --------------------------------------------------
    // 12. COMMUNICATION STATUS DIAGNOSIS
    // --------------------------------------------------

    let status =
        configurationInvalid ? 'critical' : 'optimal';


    // A. Communication hardware missing or unavailable.

    if (
        validatedDailyDataGeneratedMB > 0 &&
        baseBandwidthMbps === 0
    ) {

        status = 'critical';

        issues.push(
            'Communication failure: No available bandwidth to transmit generated scientific data.'
        );
    }


    // B. Daily data generation exceeds daily transmission capacity.

    else if (
        validatedDailyDataGeneratedMB > 0 &&
        netDailyBacklogMB > 0
    ) {

        status = 'critical';

        issues.push(
            `Communication Bottleneck: Instruments generate ${(validatedDailyDataGeneratedMB / 1024).toFixed(2)} GB/day, but downlink capacity is only ${dailyDownlinkCapacityGB.toFixed(2)} GB/day. Data backlog grows by ${(netDailyBacklogMB / 1024).toFixed(2)} GB/day.`
        );
    }


    // C. Communication capacity is sufficient but margin is small.

    else if (
        validatedDailyDataGeneratedMB > 0 &&
        downlinkMarginPercent < MINIMUM_DOWNLINK_MARGIN_PERCENT
    ) {

        if (status !== 'critical') {
            status = 'warning';
        }

        issues.push(
            `Tight Downlink Margin: Available excess communication capacity is only ${downlinkMarginPercent.toFixed(1)}%. Missed ground-station passes may cause data accumulation.`
        );
    }


    // D. No communications hardware, but no current data to transmit.

    if (
        baseBandwidthMbps === 0 &&
        validatedDailyDataGeneratedMB === 0 &&
        !configurationInvalid
    ) {

        status = 'warning';

        issues.push(
            'No communication bandwidth is configured. No data is currently being generated.'
        );
    }


    // --------------------------------------------------
    // 13. PROPAGATION DELAY DISPLAY
    // --------------------------------------------------

    const propagationDelayText =
        propagationDelaySeconds > 60

            ? `${(propagationDelaySeconds / 60).toFixed(1)} min`

            : `${propagationDelaySeconds.toFixed(3)} s`;


    // --------------------------------------------------
    // 14. FINAL COMMUNICATION RESULT
    // --------------------------------------------------

    return {

        // Communication hardware.

        baseBandwidthMbps,

        communicationAvailable:
            baseBandwidthMbps > 0,

        isOptical,

        // Destination.

        bodyId: selectedBodyId,

        distanceFactor,

        altitudeKm: validatedAltitudeKm,

        // Effective communication rates.

        effectiveDownlinkRateMbps,

        effectiveDownlinkRateMBps,

        // Contact availability.

        typicalContactMinutesPerDay,

        contactSecondsPerDay,

        // Signal propagation.

        propagationDelaySeconds,

        propagationDelayText,

        // Daily downlink capacity.

        dailyDownlinkCapacityMB,

        dailyDownlinkCapacityGB,

        // Daily data balance.

        dailyDataGeneratedMB:
            validatedDailyDataGeneratedMB,

        netDailyBacklogMB,

        downlinkMarginPercent,

        // Final diagnosis.

        status,

        issues,

    };
}
