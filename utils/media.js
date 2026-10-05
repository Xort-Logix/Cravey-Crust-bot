import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * Download media buffer from a URL
 */
export async function downloadFromUrl(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 60000,
    });
    return Buffer.from(response.data);
}

/**
 * Save buffer to downloads directory
 */
export function saveToDownloads(buffer, filename) {
    const filePath = path.join(DOWNLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

/**
 * Generate a unique filename with timestamp
 */
export function generateFilename(prefix = 'file', ext = 'bin') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${ext}`;
}

/**
 * Get MIME type extension mapping
 */
export function getExtFromMime(mimetype) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/mpeg': 'mpeg',
        'video/quicktime': 'mov',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
        'audio/opus': 'opus',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };
    return map[mimetype] || 'bin';
}

/**
 * Clean up old downloads (older than 24 hours)
 */
export function cleanOldDownloads() {
    try {
        const files = fs.readdirSync(DOWNLOADS_DIR);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(DOWNLOADS_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (err) {
        // Silently ignore cleanup errors
    }
}
