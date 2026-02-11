import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDetailedDTO } from '@duckflix/shared';

export const useMovieDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<MovieDetailedDTO>(`/movies/${id}`);
            return data;
        },
        enabled: !!id,
    });
};
