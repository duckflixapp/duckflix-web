export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getQualityLabel = (width: number, height: number, short: boolean = false): string => {
    const totalPixels = width * height;
    const longSide = Math.max(width, height);

    const THRESHOLD_8K = 25000000;
    const THRESHOLD_4K = 6000000;
    const THRESHOLD_2K = 3700000;
    const THRESHOLD_FHD = 1400000;
    const THRESHOLD_HD = 600000;

    if (longSide >= 7500 || totalPixels >= THRESHOLD_8K) return short ? '8K' : '8K UHD';
    if (longSide >= 3800 || totalPixels >= THRESHOLD_4K) return short ? '4K' : '4K UHD';
    if (longSide >= 2500 || totalPixels >= THRESHOLD_2K) return short ? '2K' : '2K QHD';
    if (longSide >= 1900 || totalPixels >= THRESHOLD_FHD) return 'FHD';
    if (longSide >= 1200 || totalPixels >= THRESHOLD_HD) return 'HD';

    return 'SD';
};

export const timeAgo = (dateInput: string | Date): string => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            if (unit === 'day' && interval === 1) return 'Yesterday';

            return `${interval}${unit.charAt(0)} ago`;
        }
    }

    return 'Just now';
};

export function getLanguageName(code: string, targetLang = 'en') {
    try {
        const displayNames = new Intl.DisplayNames([targetLang], { type: 'language' });
        return displayNames.of(code) || code;
    } catch (e) {
        console.error(e);
        return code;
    }
}

export const srtToVtt = (srtText: string): string => {
    let vtt = 'WEBVTT\n\n';

    vtt += srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    return vtt;
};
