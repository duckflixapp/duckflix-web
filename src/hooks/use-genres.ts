import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieGenreDTO } from '@duckflixapp/shared';

export const useMovieGenres = (enabled = true) => {
    const query = useQuery({
        queryKey: ['genres'],
        queryFn: async () => {
            const { genres } = await api.get<{ genres: MovieGenreDTO[] }>('/movies/genres');
            return genres;
        },
        enabled,
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    return {
        genres: query.data,
    };
};
