/**
 * ╔══════════════════════════════════════════╗
 * ║        n8n Bridge — utils/n8nBridge.js   ║
 * ║  Forwards customer WhatsApp messages to  ║
 * ║  n8n webhook for AI/automation handling  ║
 * ╚══════════════════════════════════════════╝
 *
 * Design rules:
 *  - NEVER throw / NEVER crash the WhatsApp bot
 *  - Fire-and-forget: caller does not await sendToN8n()
 *  - All secrets come from .env — never hardcoded
 */

import axios from 'axios';
import { extractLocation, extractGoogleMapsUrl } from './location.js';
import { resolveSenderIdentity } from './senderIdentity.js';

// ─── Config (read once at startup) ───────────────────────
export const N8N_ENABLED     = process.env.N8N_ENABLED !== 'false';   // true unless explicitly 'false'
export const N8N_BOT_SECRET  = process.env.N8N_BOT_SECRET  || '';
const        N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const        N8N_TIMEOUT     = parseInt(process.env.N8N_TIMEOUT || '10000', 10);

// ─── sendToN8n ────────────────────────────────────────────
/**
 * POST a normalized message payload to the n8n webhook.
 *
 * Safe to call without await — all errors are caught internally.
 * The Baileys connection will NOT be affected by n8n being unavailable.
 *
 * @param {object} payload  Built by buildN8nPayload()
 */
export async function sendToN8n(payload) {
    if (!N8N_ENABLED) return;

    if (!N8N_WEBHOOK_URL) {
        console.warn('[N8N] N8N_WEBHOOK_URL is not configured. Skipping message forward.');
        return;
    }

    const phoneDisplay = payload.phoneVerified ? payload.phone : `(unverified, source: ${payload.phoneSource})`;
    console.log(`[N8N] Forwarding message from ${phoneDisplay} (type: ${payload.messageType})`);

    try {
        await axios.post(N8N_WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Bot-Secret': N8N_BOT_SECRET,
            },
            timeout: N8N_TIMEOUT,
        });
        console.log(`[N8N] Message forwarded successfully (msgId: ${payload.messageId})`);
    } catch (err) {
        const status  = err?.response?.status;
        const errMsg  = err?.message || 'Unknown error';
        if (status) {
            console.error(`[N8N] Failed to reach webhook: HTTP ${status} — ${errMsg}`);
        } else {
            console.error(`[N8N] Failed to reach webhook: ${errMsg}`);
        }
        // Intentionally NOT re-throwing — Baileys connection must stay alive
    }
}

// ─── buildN8nPayload ──────────────────────────────────────
/**
 * Build a normalized, consistent JSON payload from a Baileys message object.
 *
 * Handles:
 *  - Plain text, captions, button/list replies
 *  - Location messages (lat/lng for delivery radius)
 *  - Media message types (image, video, audio, document, sticker)
 *  - Quoted / replied messages
 *  - Push name (best available contact name)
 *
 * @param {object} sock     Baileys socket
 * @param {object} msg      Raw Baileys message
 * @param {object} session  WhatsAppSession instance
 * @param {string} text     Pre-extracted text (from extractMessageText in bot.js)
 * @returns {object}        Normalized payload ready to POST to n8n
 */
export function buildN8nPayload(sock, msg, session, text) {
    const jid       = msg.key.remoteJid;
    const sessionId = session?.id || 'primary';

    // ── Safe sender identity resolution ────────────────────
    // Replaces the unsafe sender extraction that could treat @lid digits as a phone number.
    // resolveSenderIdentity() never converts LID bytes to phone digits.
    const identity  = resolveSenderIdentity(sock, msg, session);
    const phone     = identity.phone; // empty string when not safely known

    // Log identity resolution result (no sensitive data exposed)
    if (identity.phoneVerified) {
        console.log(`[N8N] Sender identity: verified phone source=${identity.phoneSource}`);
    } else if (identity.phoneSource === 'unresolved_lid') {
        console.log(`[N8N] Sender identity: unresolved LID, phone not available`);
    }

    // Best available contact/push name — never fail if missing
    const name = msg.pushName || '';

    // ── Message Type Detection ──────────────────────────
    const m = msg.message || {};
    let messageType = 'text';

    // ── Location extraction (WhatsApp native + Google Maps URL) ──
    // Try WhatsApp native location first (locationMessage / liveLocationMessage)
    let locationData = extractLocation(msg);

    // If no native location, check if the text contains a Google Maps URL
    if (!locationData && text) {
        const mapsUrl = extractGoogleMapsUrl(text);
        if (mapsUrl) {
            locationData = {
                type:        'google_maps_url',
                latitude:    null,
                longitude:   null,
                name:        '',
                address:     '',
                mapUrl:      mapsUrl,
                originalUrl: mapsUrl,
            };
        }
    }

    // Determine messageType based on what we found
    if (locationData) {
        if (locationData.type === 'google_maps_url') {
            messageType = 'google_maps_url';
        } else {
            // current_location or live_location both map to 'location'
            messageType = 'location';
        }
    } else if (m.imageMessage)          { messageType = 'image'; }
    else if (m.videoMessage)            { messageType = 'video'; }
    else if (m.audioMessage)            { messageType = 'audio'; }
    else if (m.documentMessage)         { messageType = 'document'; }
    else if (m.stickerMessage)          { messageType = 'sticker'; }
    else if (m.contactMessage)          { messageType = 'contact'; }
    else if (m.contactsArrayMessage)    { messageType = 'contacts'; }
    else if (m.reactionMessage)         { messageType = 'reaction'; }
    else if (m.pollCreationMessage ||
             m.pollUpdateMessage)       { messageType = 'poll'; }
    else if (m.buttonsResponseMessage ||
             m.listResponseMessage ||
             m.templateButtonReplyMessage) { messageType = 'button_reply'; }

    // ── Quoted / Replied Message Context ───────────────
    const contextInfo = (
        m.extendedTextMessage?.contextInfo  ||
        m.imageMessage?.contextInfo         ||
        m.videoMessage?.contextInfo         ||
        m.audioMessage?.contextInfo         ||
        m.documentMessage?.contextInfo      ||
        null
    );

    // ── Build Payload ───────────────────────────────────
    const payload = {
        sessionId,
        // chatId is always the routing JID — NEVER replaced by phone JID.
        // If original chat uses @lid, replies must still go to that @lid chat.
        sessionKey:      jid || phone || 'default',
        chatId:          jid,
        // phone: the verified customer phone number, or "" when not safely known.
        // NEVER contains raw @lid digits.
        phone,
        name,
        messageId:       msg.key.id,
        messageType,
        message:         text || '',
        text:            text || '',
        chatInput:       text || '',
        content:         text || '',
        timestamp:       msg.messageTimestamp
            ? Number(msg.messageTimestamp)
            : Math.floor(Date.now() / 1000),
        fromMe:          !!msg.key.fromMe,
        // ── Extended sender identity fields (additive — new in v1.1) ──
        // whatsappPhone: same as phone, verified @s.whatsapp.net phone digits
        whatsappPhone:   identity.whatsappPhone,
        // phoneVerified: true only when phone was extracted from a real PN JID
        phoneVerified:   identity.phoneVerified,
        // phoneSource: which Baileys key field the phone was resolved from
        phoneSource:     identity.phoneSource,
        // senderJid: the @s.whatsapp.net JID used for phone resolution, or ""
        senderJid:       identity.senderJid,
        // senderLid: the @lid JID of the sender, or "" if none observed
        senderLid:       identity.senderLid,
    };

    // ── Attach location object (additive — never removes existing fields) ─
    if (locationData) {
        payload.location = locationData;
        // Concise log — do not expose full coords in dashboard terminal
        console.log(`[N8N] Location detected: type=${locationData.type}`);
    }

    // Attach quoted message info (optional — only if present)
    if (contextInfo?.quotedMessage) {
        payload.quotedMessageId = contextInfo.stanzaId || null;
        const qm = contextInfo.quotedMessage;
        payload.quotedText = (
            qm?.conversation                                         ||
            qm?.extendedTextMessage?.text                            ||
            qm?.imageMessage?.caption                                ||
            qm?.videoMessage?.caption                                ||
            qm?.documentMessage?.caption                             ||
            ''
        );
    }

    return payload;
}
