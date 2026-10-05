export default {
    name: 'vdeletemsg',
    description: 'Toggle anti-delete message feature OR reply to a deleted message to recover it',
    usage: '.vdeletemsg [on/off] OR reply to a deleted message',
    category: 'Tools',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        // Ensure global state exists
        if (!global.antiDeleteEnabled) {
            global.antiDeleteEnabled = {};
        }

        // 1. Check if the user is quoting a specific message (e.g. a deleted bubble)
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const quotedStanzaId = contextInfo?.stanzaId;

        if (quotedStanzaId) {
            // Attempt to recover just this specific quoted message
            const storeKey = `${jid}_${quotedStanzaId}`;
            const cachedMsg = global.messageCache?.get(storeKey);
            
            if (cachedMsg) {
                await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
                const success = await global.recoverDeletedMessage(sock, jid, quotedStanzaId);
                
                if (success) {
                    await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
                } else {
                    await sock.sendMessage(jid, { text: '❌ Could not extract contents from this message.' }, { quoted: msg });
                }
                return; // Stop execution, we did a manual recovery
            } else {
                await sock.sendMessage(jid, {
                    text: '❌ *Message not found in cache!*\n\nThe bot was either offline when this message was sent, or it expired from memory.',
                }, { quoted: msg });
                return;
            }
        }

        // 2. If not replying to a message, treat it as a background toggle
        const action = args[0]?.toLowerCase();

        if (action === 'off') {
            global.antiDeleteEnabled[jid] = false;
            await sock.sendMessage(jid, {
                text: '🔴 *Anti-Delete Message: OFF*\n\nDeleted messages will no longer be recovered automatically.',
            }, { quoted: msg });
        } else {
            global.antiDeleteEnabled[jid] = true;
            await sock.sendMessage(jid, {
                text: '🟢 *Anti-Delete Message: ON*\n\nDeleted messages will be automatically recovered and re-sent.\n\n_Send `.vdeletemsg off` to disable.\nYou can also directly reply to a deleted message bubble with `.vdeletemsg` to recover it instantly._',
            }, { quoted: msg });
        }
    },
};
