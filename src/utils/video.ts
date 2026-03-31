import type { VideoVersionDTO } from '@duckflix/shared';

export const getTagFromVersions = (versions: VideoVersionDTO[]) => {
    if (versions.length == 0) return null;

    const highest: number = versions.reduce((max, { height }) => (height > max ? height : max), -1);

    if (highest >= 4320) return '8K Ultra HD';
    if (highest >= 2160) return '4K Ultra HD';
    if (highest >= 1440) return '2K QHD';
    if (highest >= 1080) return 'Full HD';
    if (highest >= 720) return 'HD';
    return 'SD';
};
