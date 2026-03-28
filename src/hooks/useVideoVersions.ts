import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import { useNotificationSocket, type NotificationSocketData } from './useNotificationSocket';
import type { VideoVersionDTO } from '@duckflix/shared';

const getVersionPriority = (v: VideoVersionDTO) => {
    if (v.isOriginal) return 0;
    if (v.mimeType !== 'application/x-mpegURL') return 1;
    return 2;
};

export const useVideoVersions = (videoId: string | undefined) => {
    const queryClient = useQueryClient();

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['video-versions', videoId] }), [videoId, queryClient]);

    const handleNotification = useCallback(
        (notification: NotificationSocketData) => {
            if (!videoId || notification.videoId !== videoId || !notification.videoVerId) return;
            invalidate();
        },
        [invalidate, videoId]
    );
    useNotificationSocket(handleNotification);

    const query = useQuery({
        queryKey: ['video-versions', videoId],
        queryFn: async () => {
            const { versions } = await api.get<{ versions: VideoVersionDTO[] }>(`/videos/${videoId}/versions`);
            return versions.sort((a, b) => {
                const priorityDiff = getVersionPriority(a) - getVersionPriority(b);
                if (priorityDiff !== 0) return priorityDiff;
                return b.height - a.height;
            });
        },
        enabled: !!videoId,
    });

    const addVersion = useMutation({
        mutationFn: async (height: number) => {
            await api.post(`/videos/${videoId}/versions`, { height });
        },
        onSuccess: () => {
            invalidate();
            queryClient.invalidateQueries({ queryKey: ['video-versions', videoId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to add version', { description: message });
        },
    });

    const deleteVersion = useMutation({
        mutationFn: async (versionId: string) => {
            await api.delete(`/videos/${videoId}/versions/${versionId}`);
        },
        onSuccess: () => {
            toast.success('Video version deleted');
            invalidate();
            queryClient.invalidateQueries({ queryKey: ['video-versions', videoId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete version', { description: message });
        },
    });

    return {
        versions: query.data ?? [],
        isLoadingVersions: query.isLoading,
        addVersion: addVersion.mutate,
        isAdding: addVersion.isPending,
        deleteVersion: deleteVersion.mutate,
        isDeletingVersion: deleteVersion.isPending,
    };
};
