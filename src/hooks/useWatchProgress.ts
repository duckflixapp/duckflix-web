import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { WatchHistoryDTO } from '@duckflixapp/shared';

export const useWatchProgress = (videoId: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['video', videoId, 'progress'],
        queryFn: async () => {
            const { watchHistory } = await api.get<{ watchHistory: WatchHistoryDTO }>(`/videos/${videoId}/progress`);
            return watchHistory;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 500,
        enabled: !!videoId,
    });

    const save = useMutation({
        mutationFn: async (progress: number) => {
            const { watchHistory } = await api.post<{ watchHistory: WatchHistoryDTO }>(`/videos/${videoId}/progress`, {
                positionSec: progress,
            });
            return watchHistory;
        },
        onSuccess: (data) => queryClient.setQueryData(['video', videoId, 'progress'], data),
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to save progress', { description: message });
        },
    });

    return {
        progress: query.data ?? null,
        isLoading: query.isLoading,
        save: save.mutate,
        isSaving: save.isPending,
    };
};
