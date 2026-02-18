import { useEffect, useState } from 'react';
import { socket, connectSocket } from '../lib/socket';
import type { DownloadProgress, JobProgress } from '@duckflix/shared';

export interface MovieSocketData {
    status: 'downloading' | 'processing' | 'error';
    versionId?: string;
    progress?: JobProgress | DownloadProgress;
}

export const useMovieSocket = (movieId: string | undefined) => {
    const [progress, setProgress] = useState<MovieSocketData | null>(null);

    useEffect(() => {
        if (!movieId) return;

        connectSocket();

        socket.emit('movie:join', movieId);

        socket.on('video:progress', (data: MovieSocketData) => {
            setProgress(data);
        });

        return () => {
            socket.off('video:progress');
            socket.emit('movie:leave', movieId);
        };
    }, [movieId]);

    return progress;
};
