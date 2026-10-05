export default {
    name: 'antilink',
    description: 'Toggle anti-link protection in groups',
    usage: '.antilink [on/off]',
    category: 'Group Admin',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            await sock.sendMessage(jid, {
                text: '❌ This command only works in groups!',
            }, { quoted: msg });
            return;
        }

        const isAdmin = await checkAdmin(sock, jid, msg.key.participant || msg.key.remoteJid);
        if (!isAdmin) {
            await sock.sendMessage(jid, {
                text: '❌ *Only group admins can use this command!*',
            }, { quoted: msg });
            return;
        }

        if (!global.antiLinkGroups) {
            global.antiLinkGroups = {};
        }

        const action = args[0]?.toLowerCase();

        if (action === 'off') {
            global.antiLinkGroups[jid] = false;
            await sock.sendMessage(jid, {
                text: '🔴 *Anti-Link: OFF*\n\nLinks are now allowed in this group.',
            }, { quoted: msg });
        } else {
            global.antiLinkGroups[jid] = true;
            await sock.sendMessage(jid, {
                text: '🟢 *Anti-Link: ON*\n\nMessages containing links will be automatically deleted.\n\n_Admin messages are excluded._',
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
