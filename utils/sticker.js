import sharp from 'sharp';

/**
 * Convert image buffer to WebP sticker format
 */
export async function imageToSticker(imageBuffer) {
    const sticker = await sharp(imageBuffer)
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 })
        .toBuffer();

    return sticker;
}

/**
 * Convert image buffer to a resized image
 */
export async function resizeImage(imageBuffer, width = 800, height = 800) {
    return sharp(imageBuffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
}
