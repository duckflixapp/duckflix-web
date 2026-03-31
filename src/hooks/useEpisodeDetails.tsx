import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { EpisodeDTO } from '@duckflix/shared';
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useEpisodeDetailed = (id: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['episode', id],
        queryFn: async () => {
            if (!id) return null;
            const { episode } = await api.get<{ episode: EpisodeDTO }>(`/series/episodes/${id}`);
            return episode;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 100,
        enabled: !!id,
    });

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['episode', id] }), [id, queryClient]);

    const deleteEpisode = useMutation({
        mutationFn: async () => {
            await api.delete<void>(`/series/episodes/${id}`);
        },
        onSuccess: () => {
            toast.success('Episode deleted');
            invalidate();
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete episode', { description: message });
        },
    });

    return {
        episode: query.data,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
        isLoading: query.isLoading,
        refresh: query.refetch,
        deleteEpisode: deleteEpisode.mutate,
        isDeleting: deleteEpisode.isPending,
    };
};
