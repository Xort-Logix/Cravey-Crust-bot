/**
 * ╔══════════════════════════════════════════╗
 * ║     Location Helper — utils/location.js  ║
 * ║  Detects & extracts location data from   ║
 * ║  WhatsApp messages and plain text.       ║
 * ╚══════════════════════════════════════════╝
 *
 * Exported functions:
 *   extractLocation(msg)          → location object | null
 *   extractGoogleMapsUrl(text)    → URL string | null
 *   buildGoogleMapsUrl(lat, lng)  → URL string
 */

// ─── Google Maps URL patterns ─────────────────────────────
// Matches shortened and full Google Maps URLs in plain text.
const GOOGLE_MAPS_REGEX =
    /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.)?google\.com\/maps|maps\.google\.com)[^\s]*/i;

/**
 * Unwrap common Baileys message wrappers to reach the inner message object.
 * Mirrors the same wrapper list used in extractMessageText() in bot.js.
 *
 * @param {object} m  msg.message (already one level deep from the raw msg)
 * @returns {object}  innermost message object
 */
function unwrapMessage(m) {
    if (!m) return m;
    const WRAPPERS = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
    ];
    for (let depth = 0; depth < 3; depth++) {
        let unwrapped = false;
        for (const w of WRAPPERS) {
            if (m[w] && m[w].message) {
                m = m[w].message;
                unwrapped = true;
                break;
            }
        }
        if (!unwrapped) break;
    }
    return m;
}

/**
 * Build a standard Google Maps URL from a coordinate pair.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string}
 */
export function buildGoogleMapsUrl(latitude, longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Detect and extract a Google Maps URL from a plain-text message.
 * Returns the URL string when found, otherwise null.
 *
 * Does NOT attempt to resolve shortened URLs or scrape coordinates.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function extractGoogleMapsUrl(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(GOOGLE_MAPS_REGEX);
    return match ? match[0] : null;
}

/**
 * Extract location information from a raw Baileys message object.
 *
 * Handles:
 *   - locationMessage        (standard WhatsApp current location)
 *   - liveLocationMessage    (live location share)
 *   - Messages wrapped in ephemeral / viewOnce containers
 *
 * Returns null when no location is present — never guesses coordinates.
 *
 * @param {object} msg  Raw Baileys message object (the outer msg, not msg.message)
 * @returns {{
 *   type: 'current_location'|'live_location',
 *   latitude: number,
 *   longitude: number,
 *   name: string,
 *   address: string,
 *   mapUrl: string,
 *   originalUrl: string
 * }|null}
 */
export function extractLocation(msg) {
    if (!msg || !msg.message) return null;

    const m = unwrapMessage(msg.message);
    if (!m) return null;

    // ── Standard current location ────────────────────────
    if (m.locationMessage) {
        const loc = m.locationMessage;
        const lat = loc.degreesLatitude;
        const lng = loc.degreesLongitude;
        // Use == null to reject both null and undefined while still accepting 0
        if (lat == null || lng == null) return null;

        return {
            type:        'current_location',
            latitude:    lat,
            longitude:   lng,
            name:        loc.name    || '',
            address:     loc.address || '',
            mapUrl:      buildGoogleMapsUrl(lat, lng),
            originalUrl: '',
        };
    }

    // ── Live location ─────────────────────────────────────
    if (m.liveLocationMessage) {
        const loc = m.liveLocationMessage;
        const lat = loc.degreesLatitude;
        const lng = loc.degreesLongitude;
        // Use == null to reject both null and undefined while still accepting 0
        if (lat == null || lng == null) return null;

        return {
            type:        'live_location',
            latitude:    lat,
            longitude:   lng,
            name:        loc.caption           || '',
            address:     '',
            accuracy:    loc.accuracyInMeters  || null,
            mapUrl:      buildGoogleMapsUrl(lat, lng),
            originalUrl: '',
        };
    }

    return null;
}
