import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SeriesDetailedDTO } from '@duckflix/shared';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useCallback } from 'react';

export const useSeriesDetailed = (id: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['series', id],
        queryFn: async () => {
            if (!id) return null;
            const { series } = await api.get<{ series: SeriesDetailedDTO }>(`/series/${id}`);
            return series;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 100,
        enabled: !!id,
    });

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['series', id] }), [id, queryClient]);

    const deleteSeries = useMutation({
        mutationFn: async () => {
            await api.delete<void>(`/series/${id}`);
        },
        onSuccess: () => {
            toast.success('Series deleted');
            invalidate();
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete series', { description: message });
        },
    });

    return {
        series: query.data,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
        isLoading: query.isLoading,
        refresh: query.refetch,
        deleteSeries: deleteSeries.mutate,
        isDeleting: deleteSeries.isPending,
    };
};
