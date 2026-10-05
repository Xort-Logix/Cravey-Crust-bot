export default {
    name: 'mute',
    description: 'Mute/unmute group (only admins can send messages)',
    usage: '.mute [on/off]',
    category: 'Group Admin',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            await sock.sendMessage(jid, {
                text: '❌ This command only works in groups!',
            }, { quoted: msg });
            return;
        }

        const senderJid = msg.key.participant || msg.key.remoteJid;
        const isAdmin = await checkAdmin(sock, jid, senderJid);
        if (!isAdmin) {
            await sock.sendMessage(jid, {
                text: '❌ *Only group admins can use this command!*',
            }, { quoted: msg });
            return;
        }

        // Removed fragile bot admin check. Just attempt and catch the error.

        const action = args[0]?.toLowerCase();

        try {
            if (action === 'off') {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, {
                    text: '🔊 *Group Unmuted!*\n\nAll members can now send messages.',
                }, { quoted: msg });
            } else {
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, {
                    text: '🔇 *Group Muted!*\n\nOnly admins can send messages now.\n\n_Use `.mute off` to unmute._',
                }, { quoted: msg });
            }
        } catch (err) {
            console.error('Mute error:', err);
            await sock.sendMessage(jid, {
                text: '❌ *Failed to change group settings!*',
            }, { quoted: msg });
        }
    },
};

async function checkAdmin(sock, groupJid, participantJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const normalizedJid = participantJid.replace(/:\d+/, '');
        return metadata.participants.some(p => {
            const pNorm = p.id.replace(/:\d+/, '');
            return pNorm === normalizedJid && (p.admin === 'admin' || p.admin === 'superadmin');
        });
    } catch {
        return false;
    }
}
