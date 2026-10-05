import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { imageToSticker } from '../utils/sticker.js';

export default {
    name: 'sticker',
    description: 'Convert an image to a WhatsApp sticker',
    usage: '.sticker (send with or reply to an image)',
    category: 'Tools',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        const imageMsg = msg.message?.imageMessage ||
                         msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!imageMsg) {
            await sock.sendMessage(jid, {
                text: '❌ *No image found!*\n\nSend an image with caption `.sticker` or reply to an image with `.sticker`',
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

            let downloadMsg;
            if (msg.message?.imageMessage) {
                downloadMsg = msg;
            } else {
                downloadMsg = {
                    key: msg.key,
                    message: { imageMessage: imageMsg },
                };
            }

            const buffer = await downloadMediaMessage(downloadMsg, 'buffer', {});
            const stickerBuffer = await imageToSticker(buffer);

            await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Sticker creation error:', err);
            await sock.sendMessage(jid, {
                text: '❌ *Failed to create sticker.*\n\nMake sure the image is valid and try again.',
            }, { quoted: msg });
        }
    },
};
