export default {
    name: 'broadcast',
    description: 'Broadcast a message to all groups (owner only)',
    usage: '.broadcast <message>',
    category: 'Owner',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace('@s.whatsapp.net', '');
        const ownerNumber = process.env.OWNER_NUMBER || '';

        if (senderNumber !== ownerNumber) {
            await sock.sendMessage(jid, {
                text: '❌ *This command is restricted to the bot owner!*',
            }, { quoted: msg });
            return;
        }

        const broadcastMsg = args.join(' ');
        if (!broadcastMsg) {
            await sock.sendMessage(jid, {
                text: '❌ *Please provide a message to broadcast!*\n\nUsage: `.broadcast Hello everyone!`',
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(jid, { react: { text: '📡', key: msg.key } });

            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);

            let sent = 0;
            let failed = 0;

            const formattedMsg = `📢 *BROADCAST*\n━━━━━━━━━━━━━━━\n\n${broadcastMsg}\n\n━━━━━━━━━━━━━━━\n_Sent via WhatsApp Bot_`;

            for (const groupId of groupIds) {
                try {
                    await sock.sendMessage(groupId, { text: formattedMsg });
                    sent++;
                    await new Promise(r => setTimeout(r, 1000));
                } catch {
                    failed++;
                }
            }

            await sock.sendMessage(jid, {
                text: `📡 *Broadcast Complete!*\n\n✅ Sent: ${sent} groups\n❌ Failed: ${failed} groups\n📊 Total: ${groupIds.length} groups`,
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Broadcast error:', err);
            await sock.sendMessage(jid, {
                text: '❌ *Broadcast failed!*\n\n' + err.message,
            }, { quoted: msg });
        }
    },
};
