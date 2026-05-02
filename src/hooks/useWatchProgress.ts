import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { WatchHistoryDTO } from '@duckflixapp/shared';
import { useAuthContext } from '../contexts/AuthContext';

export const useWatchProgress = (videoId: string | undefined) => {
    const queryClient = useQueryClient();
    const auth = useAuthContext();
    const profileId = auth?.profile?.id;
    const queryKey = ['video', 'progress', profileId, videoId];

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const { watchHistory } = await api.get<{ watchHistory: WatchHistoryDTO }>(`/videos/${videoId}/progress`);
            return watchHistory;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 500,
        enabled: !!videoId && !!profileId,
    });

    const save = useMutation({
        mutationFn: async (progress: number) => {
            const { watchHistory } = await api.post<{ watchHistory: WatchHistoryDTO }>(`/videos/${videoId}/progress`, {
                positionSec: progress,
            });
            return watchHistory;
        },
        onSuccess: (data) => queryClient.setQueryData(queryKey, data),
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
