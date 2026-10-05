export default {
    name: 'kick',
    description: 'Remove a member from the group',
    usage: '.kick @user',
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

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        const targets = [...mentioned];
        if (quoted && !targets.includes(quoted)) {
            targets.push(quoted);
        }

        if (targets.length === 0) {
            await sock.sendMessage(jid, {
                text: '❌ *Please mention or reply to the user you want to kick!*\n\nUsage: `.kick @user`',
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'remove');
            await sock.sendMessage(jid, {
                text: `✅ *Removed ${targets.length} member(s) from the group.*`,
            }, { quoted: msg });
        } catch (err) {
            console.error('Kick error:', err);
            await sock.sendMessage(jid, {
                text: '❌ *Failed to remove member!*\n\nThe user might be an admin.',
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
