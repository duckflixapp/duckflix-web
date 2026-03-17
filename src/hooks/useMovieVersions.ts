import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { MovieVersionDTO } from '@duckflix/shared';
import { useCallback } from 'react';
import { useNotificationSocket, type NotificationSocketData } from './useNotificationSocket';

const getVersionPriority = (v: MovieVersionDTO) => {
    if (v.isOriginal) return 0;
    if (v.mimeType !== 'application/x-mpegURL') return 1;
    return 2;
};

export const useMovieVersions = (movieId: string | undefined) => {
    const queryClient = useQueryClient();

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['movie-versions', movieId] }), [movieId, queryClient]);

    const handleNotification = useCallback(
        (notification: NotificationSocketData) => {
            if (!movieId || notification.movieId !== movieId || !notification.movieVerId) return;
            invalidate();
        },
        [invalidate, movieId]
    );
    useNotificationSocket(handleNotification);

    const query = useQuery({
        queryKey: ['movie-versions', movieId],
        queryFn: async () => {
            const { versions } = await api.get<{ versions: MovieVersionDTO[] }>(`/movies/${movieId}/versions`);
            return versions.sort((a, b) => {
                const priorityDiff = getVersionPriority(a) - getVersionPriority(b);
                if (priorityDiff !== 0) return priorityDiff;
                return b.height - a.height;
            });
        },
        enabled: !!movieId,
    });

    const addVersion = useMutation({
        mutationFn: async (height: number) => {
            await api.post(`/movies/${movieId}/versions`, { height });
        },
        onSuccess: () => {
            toast.success('Transcoding started');
            invalidate();
            queryClient.invalidateQueries({ queryKey: ['movie-versions', movieId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to add version', { description: message });
        },
    });

    const deleteVersion = useMutation({
        mutationFn: async (versionId: string) => {
            await api.delete(`/movies/${movieId}/versions/${versionId}`);
        },
        onSuccess: () => {
            toast.success('Version deleted');
            invalidate();
            queryClient.invalidateQueries({ queryKey: ['movie-versions', movieId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete version', { description: message });
        },
    });

    const deleteMovie = useMutation({
        mutationFn: async () => {
            await api.delete(`/movies/${movieId}`);
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete movie', { description: message });
        },
    });

    return {
        versions: query.data ?? [],
        isLoadingVersions: query.isLoading,
        addVersion: addVersion.mutate,
        isAdding: addVersion.isPending,
        deleteVersion: deleteVersion.mutate,
        isDeletingVersion: deleteVersion.isPending,
        deleteMovie: deleteMovie.mutate,
        isDeletingMovie: deleteMovie.isPending,
    };
};
