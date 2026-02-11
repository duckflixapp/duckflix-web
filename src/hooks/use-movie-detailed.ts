import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDetailedDTO } from '@duckflix/shared';

export const useMovieDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            if (!id) return null;
            const { movie } = await api.get<{ movie: MovieDetailedDTO }>(`/movies/${id}`);
            return movie;
        },
        enabled: !!id,
    });
};
