import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieGenreDTO } from '@duckflix/shared';

export const useMovieGenres = () => {
    const query = useQuery({
        queryKey: ['genres'],
        queryFn: async () => {
            const { genres } = await api.get<{ genres: MovieGenreDTO[] }>('/movies/genres');
            return genres;
        },
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    return {
        genres: query.data,
    };
};
