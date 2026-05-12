import type { MovieDTO, PaginatedResponse, SeriesDTO } from '@duckflixapp/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type CatalogKind = 'movies' | 'shows';
export type CatalogOrder = 'newest' | 'oldest' | 'rating' | 'title';
export type CatalogItem = MovieDTO | SeriesDTO;

export interface CatalogOptions {
    kind: CatalogKind;
    limit?: number;
    orderBy?: CatalogOrder;
    search?: string;
    genreId?: string;
}

interface FetchCatalogOptions extends CatalogOptions {
    page?: number;
}

const getCatalogUrl = (kind: CatalogKind) => (kind === 'movies' ? '/movies' : '/series');

const getCatalogParams = ({ kind, page = 1, limit = 24, orderBy = 'newest', search, genreId }: FetchCatalogOptions) => {
    const trimmedSearch = search?.trim();

    return {
        page,
        limit,
        orderBy,
        genreId: genreId || undefined,
        ...(kind === 'movies' ? { search: trimmedSearch || undefined } : { q: trimmedSearch || undefined }),
    };
};

export const fetchCatalog = (options: FetchCatalogOptions, signal?: AbortSignal) =>
    api.get<PaginatedResponse<CatalogItem>>(getCatalogUrl(options.kind), {
        params: getCatalogParams(options),
        signal,
    });

export const useInfiniteCatalog = (options: CatalogOptions) =>
    useInfiniteQuery({
        queryKey: ['catalog', options],
        queryFn: ({ pageParam = 1, signal }) => fetchCatalog({ ...options, page: pageParam }, signal),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.meta.currentPage < lastPage.meta.totalPages ? lastPage.meta.currentPage + 1 : undefined),
        staleTime: 1000 * 30,
        placeholderData: (previousData) => previousData,
    });
