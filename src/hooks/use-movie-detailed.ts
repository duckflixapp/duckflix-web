import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDetailedDTO } from '@duckflix/shared';

export const useMovieDetail = (id: string | undefined) => {
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

    return {
        movie: query.data,
        isLoading: query.isLoading,
        refresh: query.refetch,
    };
};
