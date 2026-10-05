import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'menu',
    description: 'Show all available commands',
    usage: '.menu',
    category: 'General',

    async execute(sock, msg, args) {
        // Dynamically load all commands
        const commandsDir = __dirname;
        const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

        const categories = {};

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsDir, file);
                const fileUrl = new URL(`file:///${filePath.replace(/\\/g, '/')}`);
                const mod = await import(fileUrl.href);
                const cmd = mod.default;
                if (cmd && cmd.name) {
                    const cat = cmd.category || 'Uncategorized';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(cmd);
                }
            } catch (e) {
                // Skip broken commands
            }
        }

        let menuText = `╔══════════════════╗\n`;
        menuText += `║  🤖 *WHATSAPP BOT*  ║\n`;
        menuText += `╚══════════════════╝\n\n`;
        menuText += `📋 *Command Menu*\n`;
        menuText += `━━━━━━━━━━━━━━━━━━━\n\n`;

        for (const [category, commands] of Object.entries(categories)) {
            menuText += `📂 *${category}*\n`;
            for (const cmd of commands) {
                menuText += `  ▸ \`${cmd.usage}\` — ${cmd.description}\n`;
            }
            menuText += `\n`;
        }

        menuText += `━━━━━━━━━━━━━━━━━━━\n`;
        menuText += `💡 *Tip:* Type any command to use it.\n`;
        menuText += `🔧 *Prefix:* . (dot)\n`;
        menuText += `⏰ *Uptime:* ${formatUptime(process.uptime())}\n`;

        await sock.sendMessage(msg.key.remoteJid, { text: menuText }, { quoted: msg });
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
