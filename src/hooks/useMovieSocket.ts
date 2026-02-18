import { useEffect, useState } from 'react';
import { socket, connectSocket } from '../lib/socket';
import type { DownloadProgress, JobProgress } from '@duckflix/shared';

export interface MovieSocketData {
    status: 'downloading' | 'processing' | 'error';
    versionId?: string;
    progress?: JobProgress | DownloadProgress;
}

export function useMovieSocket(movieId?: string) {
    const [progressMap, setProgressMap] = useState<Map<string, JobProgress>>(new Map());
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    useEffect(() => {
        if (!movieId) return;
        connectSocket();

        socket.emit('movie:join', movieId);

        socket.on('video:progress', (data: MovieSocketData) => {
            if (data.status === 'downloading') {
                const downloadProgress = data.progress as DownloadProgress;
                setDownloadProgress(downloadProgress);
            } else if (data.versionId) {
                const key = data.versionId;
                const jobProgress = data.progress as JobProgress;
                setProgressMap((prev) => {
                    const map = new Map(prev);
                    map.set(key, jobProgress);
                    return map;
                });
            }
        });

        return () => {
            socket.emit('movie:leave', movieId);
            socket.off('video:progress');
        };
    }, [movieId]);

    return { progressMap, downloadProgress };
}
