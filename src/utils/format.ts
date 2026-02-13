export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getQualityLabel = (width: number, height: number): string => {
    const totalPixels = width * height;
    const longSide = Math.max(width, height);

    const THRESHOLD_8K = 25000000;
    const THRESHOLD_4K = 6000000;
    const THRESHOLD_2K = 3700000;
    const THRESHOLD_FHD = 1400000;
    const THRESHOLD_HD = 600000;

    if (longSide >= 7500 || totalPixels >= THRESHOLD_8K) return '8K UHD';
    if (longSide >= 3800 || totalPixels >= THRESHOLD_4K) return '4K UHD';
    if (longSide >= 2500 || totalPixels >= THRESHOLD_2K) return '2K UHD';
    if (longSide >= 1900 || totalPixels >= THRESHOLD_FHD) return 'FHD';
    if (longSide >= 1200 || totalPixels >= THRESHOLD_HD) return 'HD';

    return 'SD';
};
