export default {
    name: 'tagall',
    description: 'Tag all group members',
    usage: '.tagall [optional message]',
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

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const mentions = participants.map(p => p.id);

            const customMessage = args.length > 0 ? args.join(' ') : 'Attention everyone!';

            let text = `📢 *${customMessage}*\n\n`;
            for (const participant of participants) {
                const number = participant.id.replace('@s.whatsapp.net', '');
                text += `▸ @${number}\n`;
            }
            text += `\n_Total: ${participants.length} members_`;

            await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
        } catch (err) {
            console.error('Tagall error:', err);
            await sock.sendMessage(jid, {
                text: '❌ *Failed to tag all members!*',
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
