import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MovieDTO, PaginatedResponse } from '@duckflix/shared';

type OrderType = 'newest' | 'oldest' | 'rating' | 'title';
interface MovieOptions {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: OrderType;
    genreId?: string;
}

const fetchMovies = (options: MovieOptions) => api.get<PaginatedResponse<MovieDTO>>(`/movies`, { params: options });

export const useInfiniteMovies = (options: Omit<MovieOptions, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['movies', 'infinite', options.orderBy, options.search, options.limit, options.genreId],
        queryFn: ({ pageParam = 1 }) => fetchMovies({ ...options, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage.meta;
            return meta.currentPage < meta.totalPages ? meta.currentPage + 1 : undefined;
        },
    });
};

const useMoviesBase = (options: MovieOptions, subKey: string) => {
    const query = useQuery({
        queryKey: ['movies', subKey, options.page, options.search, options.limit, options.genreId],
        queryFn: () => fetchMovies(options),
        retry: false,
        placeholderData: (previousData) => previousData,
    });

    return {
        data: query.data?.data ?? [],
        meta: query.data?.meta ?? null,
        isLoading: query.isLoading,
    };
};

export const useRecentMovies = (options: Omit<MovieOptions, 'orderBy'>) => {
    return useMoviesBase({ ...options, orderBy: 'newest' }, 'recent');
};

export const useBestRatedMovies = (options: Omit<MovieOptions, 'orderBy'>) => {
    return useMoviesBase({ ...options, orderBy: 'rating' }, 'rating');
};

export const useAlphabeticalMovies = (options: Omit<MovieOptions, 'orderBy'>) => {
    return useMoviesBase({ ...options, orderBy: 'title' }, 'title');
};
