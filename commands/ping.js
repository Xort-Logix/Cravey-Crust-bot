export default {
    name: 'ping',
    description: 'Check if the bot is running',
    usage: '.ping',
    category: 'General',

    async execute(sock, msg, args) {
        const startTime = Date.now();
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🏓 *Bot is running successfully!*\n\n⚡ Response time: ${Date.now() - startTime}ms\n🕐 Uptime: ${formatUptime(process.uptime())}`,
        }, { quoted: msg });
    },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}
