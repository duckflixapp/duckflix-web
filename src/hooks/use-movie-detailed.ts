import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDetailedDTO } from '@duckflix/shared';
import type { MovieUpdateFormValues } from '../schemas/movie';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export const useMovieDetail = (id: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            if (!id) return null;
            const { movie } = await api.get<{ movie: MovieDetailedDTO }>(`/movies/${id}`);
            return movie;
        },
        retry: false,
        staleTime: 100,
        enabled: !!id,
    });

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

    return {
        movie: query.data,
        isLoading: query.isLoading,
        refresh: query.refetch,
        updateMovie: updateMovie.mutate,
        isUpdating: updateMovie.isPending,
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
