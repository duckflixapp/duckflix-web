import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LibraryDTO, LibraryItemDTO, LibraryMinDTO, PaginatedResponse } from '@duckflix/shared';
import { toast } from 'sonner';

export const libraryApi = {
    getUserLibraries: () => api.get<{ libraries: LibraryMinDTO[] }>('/library/'),
    createLibrary: (data: { name: string }) => api.post<{ library: LibraryMinDTO }>('/library/', data),
    getLibrary: (id: string) => api.get<{ library: LibraryDTO }>(`/library/${id}`),
    removeLibrary: (id: string) => api.delete<void>(`/library/${id}`),

    getLibraryItems: (id: string) => api.get<PaginatedResponse<LibraryItemDTO>>(`/library/${id}/items`),
    addContent: (libId: string, contentId: string, contentType: string) =>
        api.post<void>(`/library/${libId}/items/${contentId}?type=${contentType}`),
    removeContent: (libId: string, contentId: string, contentType: string) =>
        api.delete<void>(`/library/${libId}/items/${contentId}?type=${contentType}`),
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

    const libraryItems = useInfiniteQuery({
        queryKey: ['library', libraryId, 'items'],
        queryFn: ({ pageParam = 1 }) => api.get<PaginatedResponse<LibraryItemDTO>>(`/library/${libraryId}/items?page=${pageParam}`),
        getNextPageParam: (lastPage) => {
            const next = lastPage.meta.currentPage + 1;
            return next <= lastPage.meta.totalPages ? next : undefined;
        },
        enabled: !!libraryId,
        initialPageParam: 1,
    });

    // --- MUTATIONS ---
    const addContentMutation = useMutation({
        mutationFn: ({ libId, contentId, contentType }: { libId: string; contentId: string; contentType: string }) =>
            libraryApi.addContent(libId, contentId, contentType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['library', libraryId, 'movies'] });
            if (variables.contentType === 'movie') queryClient.invalidateQueries({ queryKey: ['movie', variables.contentId] });
            else queryClient.invalidateQueries({ queryKey: ['series', variables.contentId] });
        },
    });

    const removeContentMutation = useMutation({
        mutationFn: ({ libId, contentId, contentType }: { libId: string; contentId: string; contentType: string }) =>
            libraryApi.removeContent(libId, contentId, contentType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['library', libraryId, 'movies'] });
            if (variables.contentType === 'movie') queryClient.invalidateQueries({ queryKey: ['movie', variables.contentId] });
            else queryClient.invalidateQueries({ queryKey: ['series', variables.contentId] });
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
        libraryItems,
        addContent: addContentMutation.mutate,
        removeContent: removeContentMutation.mutate,
        createLibrary: createLibrary.mutate,
        isCreating: createLibrary.isPending,
        deleteLibrary: deleteLibrary.mutate,
        isDeleting: deleteLibrary.isPending,
    };
};
