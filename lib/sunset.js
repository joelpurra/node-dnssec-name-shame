"use strict";

const logger = require("./logger.js")("sunset"),
    configuration = require("configvention"),

    // TODO: assert configuration value ranges.
    sunsetStart = Date.parse(configuration.get("sunset-date-start")),
    sunsetTarget = Date.parse(configuration.get("sunset-date-target")),
    maximumThreshold = configuration.get("sunset-maximum-threshold");

/**
 * Calculate whether the response to request should be labeled as sunsetting, if the provided random value is smaller than a calculated threshold.
 * The ratio of "sunset" results increases over time, from the sunset start date to the sunset target date, up to a maximum threshold.
 * The function externalizes variable inputs, in particular current timestamps and randomness.
 * @param {number} progressNow The current timestamp (time value in milliseconds since midnight, January 1, 1970 UTC) from Date.now().
 * @param {number} randomValue A random floating point value in range "[0,1)" from Math.random().
 * @returns True if the response to the request should be labeled as sunsetting.
 */
function isAboveSunsetThreshold(progressNow, randomValue) {
    if (progressNow < sunsetStart) {
        // NOTE: could allow timestamps before the start, if taking negative progress values into account (it's just undocumented and untested).
        throw new RangeError("Cannot compare timestamp before start of sunset range.");
    }

    if (randomValue < 0 || randomValue >= 1) {
        throw new RangeError("Random value should be in range [0,1).");
    }

    // NOTE: sunset progress is something like a progress bar filling from start date to target date.
    // NOTE: first calculate the sunset progress made "now" within the fixed-size sunset period (gives range "[0,inf)").
    // NOTE: then calculate the effective threshold value (gives range "[0,maximum]") to cap the threshold.
    // NOTE: if the provided "random value" (range "[0,1)") is smaller than the threshold, the request-response should be "sunsetting".
    // NOTE: this ensures that most requests succeed near the start date, and most fail near or after the target date (up to maximum portion of requests).
    const sunsetPeriod = (sunsetTarget - sunsetStart),
        progressPeriod = (progressNow - sunsetStart),
        sunsetProgress = (progressPeriod / sunsetPeriod),
        effectiveThreshold = Math.min(maximumThreshold, sunsetProgress),
        isSunset = randomValue < effectiveThreshold;

    logger.trace({
        sunsetStart,
        sunsetTarget,
        sunsetPeriod,
        progressNow,
        progressPeriod,
        sunsetProgress,
        maximumThreshold,
        effectiveThreshold,
        randomValue,
        isSunset,
    });

    return isSunset;
}

module.exports = isAboveSunsetThreshold;
