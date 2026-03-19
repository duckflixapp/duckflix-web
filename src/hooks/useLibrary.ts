import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LibraryDTO, LibraryItemDTO, LibraryMinDTO, PaginatedResponse } from '@duckflix/shared';
import { toast } from 'sonner';

export const libraryApi = {
    getUserLibraries: () => api.get<{ libraries: LibraryMinDTO[] }>('/library/'),
    createLibrary: (data: { name: string }) => api.post<{ library: LibraryMinDTO }>('/library/', data),
    getLibrary: (id: string) => api.get<{ library: LibraryDTO }>(`/library/${id}`),
    removeLibrary: (id: string) => api.delete<void>(`/library/${id}`),

    getLibraryMovies: (id: string) => api.get<PaginatedResponse<LibraryItemDTO>>(`/library/${id}/movies`),
    addMovie: (libId: string, movieId: string) => api.post<void>(`/library/${libId}/movies/${movieId}`),
    removeMovie: (libId: string, movieId: string) => api.delete<void>(`/library/${libId}/movies/${movieId}`),
};

export const useLibrary = (libraryId?: string) => {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['libraries'] });

    // --- QUERIES ---
    const libraries = useQuery({
        queryKey: ['libraries'],
        queryFn: libraryApi.getUserLibraries,
    });

    const libraryDetails = useQuery({
        queryKey: ['library', libraryId],
        queryFn: () => libraryApi.getLibrary(libraryId!),
        enabled: !!libraryId,
    });

    const libraryMovies = useInfiniteQuery({
        queryKey: ['library', libraryId, 'movies'],
        queryFn: ({ pageParam = 1 }) => api.get<PaginatedResponse<LibraryItemDTO>>(`/library/${libraryId}/movies?page=${pageParam}`),
        getNextPageParam: (lastPage) => {
            const next = lastPage.meta.currentPage + 1;
            return next <= lastPage.meta.totalPages ? next : undefined;
        },
        enabled: !!libraryId,
        initialPageParam: 1,
    });

    // --- MUTATIONS ---
    const addMovieMutation = useMutation({
        mutationFn: ({ libId, movieId }: { libId: string; movieId: string }) => libraryApi.addMovie(libId, movieId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['library', libraryId, 'movies'] });
            queryClient.invalidateQueries({ queryKey: ['movie', variables.movieId] });
        },
    });

    const removeMovieMutation = useMutation({
        mutationFn: ({ libId, movieId }: { libId: string; movieId: string }) => libraryApi.removeMovie(libId, movieId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['library', libraryId, 'movies'] });
            queryClient.invalidateQueries({ queryKey: ['movie', variables.movieId] });
        },
    });

    const createLibrary = useMutation({
        mutationFn: async (name: string) => await api.post('/library', { name }),
        onSuccess: () => {
            toast.success('Collection created');
            invalidate();
        },
        onError: (err) => {
            toast.error('Failed to create collection');
            console.error(err);
        },
    });

    const deleteLibrary = useMutation({
        mutationFn: async (id: string) => await api.delete(`/library/${id}`),
        onSuccess: () => {
            toast.success('Collection deleted');
            invalidate();
        },
        onError: (err) => {
            toast.error('Failed to delete collection');
            console.error(err);
        },
    });

    return {
        libraries,
        libraryDetails,
        libraryMovies,
        addMovie: addMovieMutation.mutate,
        removeMovie: removeMovieMutation.mutate,
        createLibrary: createLibrary.mutate,
        isCreating: createLibrary.isPending,
        deleteLibrary: deleteLibrary.mutate,
        isDeleting: deleteLibrary.isPending,
    };
};
