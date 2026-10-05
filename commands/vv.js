import { downloadContentFromMessage } from '@whiskeysockets/baileys';

/**
 * Recursively unwrap a message to find the true underlying media message.
 * This handles ephemeralMessage, viewOnceMessage, viewOnceMessageV2, documentWithCaptionMessage, etc.
 */
function extractMediaMessage(message) {
    if (!message) return null;

    // Check common wrappers
    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
        'ptvMessage'
    ];

    for (const wrapper of wrappers) {
        if (message[wrapper] && message[wrapper].message) {
            const extracted = extractMediaMessage(message[wrapper].message);
            if (extracted) return extracted;
        }
    }

    // Direct media types
    if (message.imageMessage) return { type: 'image', msg: message.imageMessage };
    if (message.videoMessage) return { type: 'video', msg: message.videoMessage };
    if (message.audioMessage) return { type: 'audio', msg: message.audioMessage };
    if (message.documentMessage) return { type: 'document', msg: message.documentMessage };
    if (message.ptvMessage) return { type: 'video', msg: message.ptvMessage }; // PTV is a video

    return null;
}

export default {
    name: 'vv',
    description: 'Save view-once messages (images, videos, documents, voice notes)',
    usage: '.vv (reply to a view-once message)',
    category: 'Tools',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        // Always send recovered media privately to the bot owner, not in the group
        const configuredOwner = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.replace(/\D/g, '') : null;
        const botNumber = sock.user?.id?.split('@')[0]?.split(':')[0];
        const privateJid = (configuredOwner ? `${configuredOwner}@s.whatsapp.net` : null) || (botNumber ? `${botNumber}@s.whatsapp.net` : null);

        // Ensure we're replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            await sock.sendMessage(privateJid, {
                text: '❌ *Please reply to a view-once message with `.vv`!*',
            }, { quoted: msg });
            return;
        }

        // Extract the underlying media message from the quoted message
        const extracted = extractMediaMessage(quotedMsg);

        if (!extracted) {
            await sock.sendMessage(privateJid, {
                text: '❌ *Could not find any view-once or media content in the replied message.*',
            }, { quoted: msg });
            return;
        }

        const { type, msg: mediaMsg } = extracted;

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

            // Download using downloadContentFromMessage for safety and compatibility
            const stream = await downloadContentFromMessage(
                mediaMsg,
                type === 'document' ? 'document' : type
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const caption = mediaMsg.caption
                ? ` *Saved View-Once*\n\n${mediaMsg.caption}`
                : ' *next time kro gy view once mai send ?*';

            // Resend based on type — sent PRIVATELY to owner only, not in the group
            const sourceInfo = jid.endsWith('@g.us') ? `\n📍 *From group:* ${jid.replace('@g.us', '')}` : '';
            const fullCaption = caption + sourceInfo;

            if (type === 'image') {
                await sock.sendMessage(privateJid, { image: buffer, caption: fullCaption });
            } else if (type === 'video') {
                await sock.sendMessage(privateJid, { video: buffer, caption: fullCaption });
            } else if (type === 'audio') {
                await sock.sendMessage(privateJid, {
                    audio: buffer,
                    mimetype: 'audio/mp4',
                    ptt: mediaMsg.ptt || false
                });
            } else if (type === 'document') {
                await sock.sendMessage(privateJid, {
                    document: buffer,
                    mimetype: mediaMsg.mimetype || 'application/octet-stream',
                    fileName: mediaMsg.fileName || 'view_once_document',
                    caption: fullCaption
                });
            }

            // React only visible to you (reaction on your own .vv message)
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('View-once save error:', err);
            await sock.sendMessage(privateJid, {
                text: '❌ *Failed to download view-once message.*\nMake sure the message is fully loaded and not expired on the bot side.',
            }, { quoted: msg });
        }
    },
};
