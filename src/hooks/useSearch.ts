import type { PaginatedResponse, SearchResultDTO } from '@duckflix/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type SortField = 'date' | 'title' | 'rating' | 'release';
export type SortOrder = 'asc' | 'desc';

export interface SearchParams {
    page?: number;
    limit?: number;
    q?: string;
    sort?: [SortField, SortOrder];
    genres?: string[];
}

const formatParams = (params: SearchParams) => ({
    ...params,
    sort: params.sort?.join(','),
    genres: params.genres?.join(','),
});

// ----- Unified -----
export const fetchUnified = (options: SearchParams) =>
    api.get<PaginatedResponse<SearchResultDTO>>(`/search`, { params: formatParams(options) });

export const useInfiniteSearch = (options: Omit<SearchParams, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['search', 'infinite', options],
        queryFn: ({ pageParam = 1 }) => fetchUnified({ ...options, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.meta.currentPage < lastPage.meta.totalPages ? lastPage.meta.currentPage + 1 : undefined),
    });
};

export const useSearchBase = (options: SearchParams) => {
    const query = useQuery({
        queryKey: ['search', options.q, options.limit, options.page, options.genres, options.sort],
        queryFn: () => fetchUnified(options),
        retry: false,
        staleTime: 350,
        placeholderData: (previousData) => previousData,
    });

    return {
        data: query.data?.data ?? [],
        meta: query.data?.meta ?? null,
        isLoading: query.isLoading,
    };
};

export const useRecentUnified = (limit = 12) => useSearchBase({ limit, sort: ['date', 'desc'] });

export const useBestRatedUnified = (limit = 12) => useSearchBase({ limit, sort: ['rating', 'desc'] });
