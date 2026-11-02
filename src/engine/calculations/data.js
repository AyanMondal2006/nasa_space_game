
/**
 * Onboard Data Management Engine
 *
 * Calculates:
 * 1. Instrument data-generation rates
 * 2. Data compression
 * 3. Hourly and daily data generation
 * 4. Duty-cycle-adjusted data volume
 * 5. Onboard storage requirements
 * 6. Data accumulated between ground-station contacts
 * 7. Storage utilization and overflow risks
 *
 * Data units:
 * Mbps = Megabits per second
 * MB   = Binary Megabytes (1024-based conversion)
 * GB   = Binary Gigabytes
 */

const DEFAULT_COMPRESSION_RATIO = 0.6;
const DEFAULT_STORAGE_CAPACITY_GB = 16;
const DEFAULT_DUTY_CYCLE = 0.5;
const DEFAULT_CONTACT_GAP_HOURS = 12;

const STORAGE_WARNING_THRESHOLD = 80;


/**
 * Validates a non-negative numerical input.
 *
 * Missing values use the supplied default.
 * Invalid or negative values are reported.
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
 * Calculates onboard data-generation and storage requirements.
 *
 * @param {object} params
 * @param {Array} params.instruments
 * @param {object} params.computing
 * @param {number} params.dutyCycleFraction
 * @param {number} params.maxContactGapHours
 *
 * @returns {object} Data budget metrics
 */

export function calculateDataBudget({

    instruments = [],
    computing = null,
    dutyCycleFraction = DEFAULT_DUTY_CYCLE,
    maxContactGapHours = DEFAULT_CONTACT_GAP_HOURS,

} = {}) {

    const issues = [];


    // --------------------------------------------------
    // 1. VALIDATE INSTRUMENT CONFIGURATION
    // --------------------------------------------------

    if (!Array.isArray(instruments)) {

        issues.push(
            'Invalid instrument configuration. Expected an array.'
        );

        instruments = [];
    }


    // --------------------------------------------------
    // 2. CALCULATE RAW DATA GENERATION RATE
    // --------------------------------------------------

    const rawRateMbps = instruments.reduce(
        (total, instrument, index) => {

            const dataRate = readNonNegative(
                instrument?.dataRateMbps,
                `instrument ${index + 1} data rate`,
                issues
            );

            return total + dataRate;

        },
        0
    );


    // --------------------------------------------------
    // 3. DATA COMPRESSION
    // --------------------------------------------------

    let compressionRatio;

    if (computing?.compressionFactor == null) {

        compressionRatio = DEFAULT_COMPRESSION_RATIO;

    } else {

        const configuredRatio = Number(
            computing.compressionFactor
        );

        if (
            !Number.isFinite(configuredRatio) ||
            configuredRatio <= 0
        ) {

            issues.push(
                'Invalid compression factor. Expected a finite value greater than zero. Using 1 (no compression).'
            );

            compressionRatio = 1;

        } else {

            compressionRatio = configuredRatio;
        }
    }


    // Effective data rate after compression.

    const effectiveRateMbps =
        rawRateMbps * compressionRatio;


    // Convert Mbps into MB/s.
    // Retains the existing 1024-based unit convention.

    const effectiveRateMBps =
        (effectiveRateMbps * 1e6) / (8 * 1024 * 1024);


    // --------------------------------------------------
    // 4. HOURLY DATA GENERATION
    // --------------------------------------------------

    // Data generated during one active observation hour.

    const hourlyDataMB =
        effectiveRateMBps * 3600;


    // --------------------------------------------------
    // 5. DUTY-CYCLE VALIDATION
    // --------------------------------------------------

    let validatedDutyCycle;

    if (
        dutyCycleFraction === undefined ||
        dutyCycleFraction === null
    ) {

        validatedDutyCycle = DEFAULT_DUTY_CYCLE;

    } else {

        const configuredDutyCycle = Number(
            dutyCycleFraction
        );

        if (!Number.isFinite(configuredDutyCycle)) {

            issues.push(
                'Invalid duty cycle. Using the default 50%.'
            );

            validatedDutyCycle = DEFAULT_DUTY_CYCLE;

        } else {

            validatedDutyCycle = Math.max(
                0,
                Math.min(1, configuredDutyCycle)
            );

            if (configuredDutyCycle < 0 || configuredDutyCycle > 1) {

                issues.push(
                    `Duty cycle (${configuredDutyCycle}) is outside the valid range 0 to 1. It has been clamped to ${validatedDutyCycle}.`
                );
            }
        }
    }


    // --------------------------------------------------
    // 6. DAILY DATA GENERATION
    // --------------------------------------------------

    const activeHoursPerDay =
        24 * validatedDutyCycle;

    const dailyDataVolumeMB =
        hourlyDataMB * activeHoursPerDay;

    const dailyDataVolumeGB =
        dailyDataVolumeMB / 1024;


    // --------------------------------------------------
    // 7. ONBOARD STORAGE CAPACITY
    // --------------------------------------------------

    let storageCapacityGB;

    if (computing?.storageCapacityGB == null) {

        storageCapacityGB = DEFAULT_STORAGE_CAPACITY_GB;

    } else {

        storageCapacityGB = readNonNegative(
            computing.storageCapacityGB,
            'storage capacity',
            issues,
            0
        );
    }

    const storageCapacityMB =
        storageCapacityGB * 1024;


    // --------------------------------------------------
    // 8. MAXIMUM DATA ACCUMULATION BETWEEN CONTACTS
    // --------------------------------------------------

    const validatedContactGapHours = readNonNegative(
        maxContactGapHours,
        'maximum contact gap',
        issues,
        DEFAULT_CONTACT_GAP_HOURS
    );


    // Instruments are active only for the configured
    // fraction of the contact-gap duration.

    const activeHoursDuringGap =
        validatedContactGapHours * validatedDutyCycle;


    const accumulatedDataInGapMB =
        hourlyDataMB * activeHoursDuringGap;

    const accumulatedDataInGapGB =
        accumulatedDataInGapMB / 1024;


    // --------------------------------------------------
    // 9. STORAGE UTILIZATION
    // --------------------------------------------------

    let gapStorageUtilizationPercent;

    if (storageCapacityMB > 0) {

        gapStorageUtilizationPercent =
            (accumulatedDataInGapMB / storageCapacityMB) * 100;

    } else {

        // Avoid division by zero.

        gapStorageUtilizationPercent =
            accumulatedDataInGapMB > 0 ? 100 : 0;
    }


    // --------------------------------------------------
    // 10. STORAGE AND DATA MANAGEMENT STATUS
    // --------------------------------------------------

    let status = issues.length > 0
        ? 'critical'
        : 'optimal';


    // A. Data exceeds available onboard storage.

    if (accumulatedDataInGapMB > storageCapacityMB) {

        status = 'critical';

        issues.push(
            `Buffer Overflow Risk: Data accumulated between downlink passes (${accumulatedDataInGapGB.toFixed(2)} GB) exceeds onboard storage (${storageCapacityGB.toFixed(2)} GB). Scientific data may be lost.`
        );
    }


    // B. Storage utilization approaches its limit.

    else if (
        gapStorageUtilizationPercent > STORAGE_WARNING_THRESHOLD
    ) {

        if (status !== 'critical') {
            status = 'warning';
        }

        issues.push(
            `High Storage Utilization: Approximately ${gapStorageUtilizationPercent.toFixed(1)}% of onboard memory will be occupied between ground-station passes.`
        );
    }


    // --------------------------------------------------
    // 11. RETURN DATA BUDGET METRICS
    // --------------------------------------------------

    return {

        // Data-generation rates.

        rawRateMbps,
        effectiveRateMbps,
        effectiveRateMBps,

        hourlyDataMB,

        // Duty cycle.

        dutyCycleFraction: validatedDutyCycle,
        activeHoursPerDay,
        activeHoursDuringGap,

        // Daily data generation.

        dailyDataVolumeMB,
        dailyDataVolumeGB,

        // Compression.

        compressionRatio,

        // Storage.

        storageCapacityGB,
        storageCapacityMB,

        // Ground-station contact gap.

        maxContactGapHours: validatedContactGapHours,

        accumulatedDataInGapMB,
        accumulatedDataInGapGB,

        gapStorageUtilizationPercent,

        // Final diagnosis.

        status,
        issues,

    };
}
