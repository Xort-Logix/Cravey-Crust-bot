import axios from 'axios';
import { downloadFromUrl, generateFilename, getExtFromMime } from '../utils/media.js';

export default {
    name: 'download',
    description: 'Download media from Instagram/YouTube/TikTok URLs',
    usage: '.download <url>',
    category: 'Downloader',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = args[0];

        if (!url) {
            await sock.sendMessage(jid, {
                text: '❌ *Please provide a URL!*\n\nUsage: `.download <url>`\n\nSupported:\n• Instagram posts/reels\n• TikTok videos\n• Twitter/X posts',
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

            if (url.includes('instagram.com') || url.includes('instagr.am')) {
                await downloadInstagram(sock, msg, jid, url);
            } else if (url.includes('tiktok.com')) {
                await downloadTikTok(sock, msg, jid, url);
            } else {
                await sock.sendMessage(jid, {
                    text: '❌ *Unsupported URL!*\n\nCurrently supported platforms:\n• Instagram\n• TikTok\n\n_More platforms coming soon!_',
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Download error:', err.message);
            await sock.sendMessage(jid, {
                text: `❌ *Download failed!*\n\nError: ${err.message}\n\n_The URL might be private or the service is temporarily unavailable._`,
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        }
    },
};

async function downloadInstagram(sock, msg, jid, url) {
    try {
        const apiUrl = `https://api.cobalt.tools/`;
        const response = await axios.post(apiUrl, {
            url: url,
            downloadMode: 'auto',
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        if (response.data && response.data.url) {
            const mediaBuffer = await downloadFromUrl(response.data.url);
            const isVideo = response.data.url.includes('.mp4') || url.includes('/reel');

            if (isVideo) {
                await sock.sendMessage(jid, {
                    video: mediaBuffer,
                    caption: '📥 *Downloaded from Instagram*\n_Via WhatsApp Bot_',
                }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, {
                    image: mediaBuffer,
                    caption: '📥 *Downloaded from Instagram*\n_Via WhatsApp Bot_',
                }, { quoted: msg });
            }
        } else {
            throw new Error('Could not fetch media from Instagram');
        }
    } catch (err) {
        try {
            const fallbackUrl = `https://api.saveig.app/api/v1/fetch?url=${encodeURIComponent(url)}`;
            const fallbackRes = await axios.get(fallbackUrl, { timeout: 15000 });

            if (fallbackRes.data && fallbackRes.data.data && fallbackRes.data.data.length > 0) {
                for (const item of fallbackRes.data.data) {
                    const mediaBuffer = await downloadFromUrl(item.url);
                    if (item.type === 'video') {
                        await sock.sendMessage(jid, {
                            video: mediaBuffer,
                            caption: '📥 *Downloaded from Instagram*',
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(jid, {
                            image: mediaBuffer,
                            caption: '📥 *Downloaded from Instagram*',
                        }, { quoted: msg });
                    }
                }
            } else {
                throw new Error('No media found');
            }
        } catch (fallbackErr) {
            throw new Error('Instagram download failed. The post might be private or the service is unavailable.');
        }
    }
}

async function downloadTikTok(sock, msg, jid, url) {
    try {
        const apiUrl = `https://api.cobalt.tools/`;
        const response = await axios.post(apiUrl, {
            url: url,
            downloadMode: 'auto',
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        if (response.data && response.data.url) {
            const mediaBuffer = await downloadFromUrl(response.data.url);
            await sock.sendMessage(jid, {
                video: mediaBuffer,
                caption: '📥 *Downloaded from TikTok*\n_Via WhatsApp Bot_',
            }, { quoted: msg });
        } else {
            throw new Error('Could not fetch video from TikTok');
        }
    } catch (err) {
        throw new Error('TikTok download failed. ' + err.message);
    }
}
