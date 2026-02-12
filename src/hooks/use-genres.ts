import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GenreDTO } from '@duckflix/shared';

export const useGenres = () => {
    return useQuery({
        queryKey: ['genres'],
        queryFn: async () => {
            const { genres } = await api.get<{ genres: GenreDTO[] }>('/movies/genres');
            return genres;
        },
        placeholderData: (previousData) => previousData,
    });
};
