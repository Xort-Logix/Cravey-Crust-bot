/**
 * ╔══════════════════════════════════════════╗
 * ║     n8n Outbound Route — routes/n8n.js   ║
 * ║  Called by n8n HTTP Request node to send ║
 * ║  AI-generated replies back to WhatsApp   ║
 * ╚══════════════════════════════════════════╝
 *
 * Endpoint:  POST /api/n8n/send-message
 * Auth:      X-Bot-Secret header (N8N_BOT_SECRET from .env)
 *
 * Security:
 *  - Validates X-Bot-Secret before doing anything else
 *  - Validates all required fields (sessionId, chatId, message)
 *  - Never exposes Baileys socket object or session credentials
 *  - Rejects empty messages to prevent WhatsApp spam loops
 */

import express from 'express';

const router = express.Router();

// Injected from bot.js so this route can resolve the correct Baileys socket
let _activeSessions = null;

/**
 * Call this once from bot.js after activeSessions Map is created.
 * @param {Map} sessionsMap  The activeSessions Map from bot.js
 */
export function injectSessions(sessionsMap) {
    _activeSessions = sessionsMap;
}

// Read secret once at startup
const N8N_BOT_SECRET = process.env.N8N_BOT_SECRET || '';

// ─── POST /api/n8n/send-message ───────────────────────────
router.post('/send-message', async (req, res) => {

    // ── Step 1: Authenticate via X-Bot-Secret ─────────────
    const incomingSecret = (req.headers['x-bot-secret'] || '').trim();
    if (!N8N_BOT_SECRET) {
        console.error('[N8N] N8N_BOT_SECRET is not configured. Rejecting all requests to /api/n8n/send-message.');
        return res.status(503).json({ success: false, error: 'Endpoint not configured (missing N8N_BOT_SECRET)' });
    }
    if (incomingSecret !== N8N_BOT_SECRET) {
        console.warn('[N8N] Unauthorized request to /api/n8n/send-message — invalid X-Bot-Secret');
        return res.status(401).json({ success: false, error: 'Unauthorized: invalid X-Bot-Secret' });
    }

    // ── Step 2: Validate Input ────────────────────────────
    const { sessionId, chatId, message } = req.body || {};

    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
        return res.status(400).json({ success: false, error: 'sessionId is required' });
    }
    if (!chatId || typeof chatId !== 'string' || !chatId.includes('@')) {
        return res.status(400).json({
            success: false,
            error: 'chatId is required and must be a valid WhatsApp JID (e.g. 923001234567@s.whatsapp.net)',
        });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, error: 'message is required and must not be empty' });
    }

    // ── Step 3: Resolve Session ───────────────────────────
    if (!_activeSessions) {
        return res.status(503).json({ success: false, error: 'Session manager not initialized yet' });
    }

    // Allow "main" as a convenient alias for "primary"
    const resolvedId = (sessionId.trim() === 'main') ? 'primary' : sessionId.trim();
    const session = _activeSessions.get(resolvedId);

    if (!session) {
        return res.status(404).json({
            success: false,
            error: `Session '${sessionId}' not found`,
            availableSessions: Array.from(_activeSessions.keys()),
        });
    }

    if (session.state !== 'connected' || !session.sock) {
        return res.status(503).json({
            success: false,
            error: `Session '${sessionId}' is not currently connected (state: ${session.state})`,
        });
    }

    // ── Step 4: Send WhatsApp Message ─────────────────────
    try {
        const cleanChatId  = chatId.trim();
        const cleanMessage = message.trim();

        console.log(`[N8N] Sending reply to ${cleanChatId} via session '${resolvedId}'`);
        await session.sock.sendMessage(cleanChatId, { text: cleanMessage });
        console.log(`[N8N] Reply sent successfully to ${cleanChatId}`);

        return res.json({ success: true });
    } catch (err) {
        console.error(`[N8N] Failed to send reply to ${chatId}:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
