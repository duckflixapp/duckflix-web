import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDTO, PaginatedResponse } from '@duckflix/shared';

export const useMovies = (page = 1, search = '') => {
    return useQuery({
        queryKey: ['movies', page, search],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<MovieDTO>>('/movies', {
                params: { page, limit: 12, search },
            });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });
};
