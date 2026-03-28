import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDetailedDTO } from '@duckflix/shared';
import type { MovieUpdateFormValues } from '../schemas/movie';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useCallback } from 'react';
import { useNotificationSocket, type NotificationSocketData } from './useNotificationSocket';

export const useMovieDetailed = (id: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            if (!id) return null;
            const { movie } = await api.get<{ movie: MovieDetailedDTO }>(`/movies/${id}`);
            return movie;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 100,
        enabled: !!id,
    });

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['movie', id] }), [id, queryClient]);

    const movie = query.data;
    const handleNotification = useCallback(
        (notification: NotificationSocketData) => {
            if (notification.videoId !== movie?.videoId) return;
            invalidate();
        },
        [movie, invalidate]
    );
    useNotificationSocket(handleNotification);

    const updateMovie = useMutation({
        mutationFn: async (data: MovieUpdateFormValues) => {
            const { movie } = await api.patch<{ movie: MovieDetailedDTO }>(`/movies/${id}`, data);
            return movie;
        },
        onSuccess: () => {
            toast.success('Movie updated');
            queryClient.invalidateQueries({ queryKey: ['movie', id] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to update movie', { description: message });
        },
    });

    const deleteMovie = useMutation({
        mutationFn: async () => await api.delete(`/movies/${id}`),
        onSuccess: () => {
            toast.success('Movie deleted');
            queryClient.invalidateQueries({ queryKey: ['movie', id] });
            queryClient.invalidateQueries({ queryKey: ['movie', 'featured'] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete movie', { description: message });
        },
    });

    return {
        movie: query.data,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
        isLoading: query.isLoading,
        refresh: query.refetch,
        updateMovie: updateMovie.mutate,
        isUpdating: updateMovie.isPending,
        deleteMovie: deleteMovie.mutate,
        isDeletingMovie: deleteMovie.isPending,
    };
};

export const useFeaturedMovie = () => {
    const query = useQuery({
        queryKey: ['movie', 'featured'],
        queryFn: async () => {
            const { movie } = await api.get<{ movie: MovieDetailedDTO | null }>(`/movies/featured`);
            return movie;
        },
        retry: false,
        staleTime: 100,
    });

    return {
        movie: query.data ?? null,
        isLoading: query.isLoading,
        refresh: query.refetch,
    };
};
