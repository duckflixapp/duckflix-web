import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SeasonDTO } from '@duckflix/shared';
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useSeasonDetailed = (id: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['season', id],
        queryFn: async () => {
            if (!id) return null;
            const { season } = await api.get<{ season: SeasonDTO }>(`/series/seasons/${id}`);
            return season;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 100,
        enabled: !!id,
    });

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['season', id] }), [id, queryClient]);

    const deleteSeason = useMutation({
        mutationFn: async () => {
            await api.delete<void>(`/series/seasons/${id}`);
        },
        onSuccess: () => {
            toast.success('Season deleted');
            invalidate();
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete season', { description: message });
        },
    });

    return {
        season: query.data,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
        isLoading: query.isLoading,
        refresh: query.refetch,
        deleteSeason: deleteSeason.mutate,
        isDeleting: deleteSeason.isPending,
    };
};
