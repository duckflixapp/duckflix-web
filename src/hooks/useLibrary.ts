import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LibraryDTO, LibraryItemDTO, LibraryMinDTO, PaginatedResponse } from '@duckflixapp/shared';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';

export const libraryApi = {
    getUserLibraries: () => api.get<{ libraries: LibraryMinDTO[] }>('/libraries/'),
    createLibrary: (data: { name: string }) => api.post<{ library: LibraryMinDTO }>('/libraries/', data),
    getLibrary: (id: string) => api.get<{ library: LibraryDTO }>(`/libraries/${id}`),
    removeLibrary: (id: string) => api.delete<void>(`/libraries/${id}`),

    getLibraryItems: (id: string) => api.get<PaginatedResponse<LibraryItemDTO>>(`/libraries/${id}/items`),
    addContent: (libId: string, contentId: string, contentType: string) =>
        api.post<void>(`/libraries/${libId}/items/${contentId}?type=${contentType}`),
    removeContent: (libId: string, contentId: string, contentType: string) =>
        api.delete<void>(`/libraries/${libId}/items/${contentId}?type=${contentType}`),
};

export const useLibrary = (libraryId?: string) => {
    const queryClient = useQueryClient();
    const auth = useAuthContext();
    const profileId = auth?.profile?.id;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['libraries', profileId] });

    // --- QUERIES ---
    const libraries = useQuery({
        queryKey: ['libraries', profileId],
        queryFn: libraryApi.getUserLibraries,
        enabled: !!profileId,
    });

    const libraryDetails = useQuery({
        queryKey: ['libraries', profileId, libraryId],
        queryFn: () => libraryApi.getLibrary(libraryId!),
        enabled: !!profileId && !!libraryId,
    });

    const libraryItems = useInfiniteQuery({
        queryKey: ['libraries', profileId, libraryId, 'items'],
        queryFn: ({ pageParam = 1 }) => api.get<PaginatedResponse<LibraryItemDTO>>(`/libraries/${libraryId}/items?page=${pageParam}`),
        getNextPageParam: (lastPage) => {
            const next = lastPage.meta.currentPage + 1;
            return next <= lastPage.meta.totalPages ? next : undefined;
        },
        enabled: !!profileId && !!libraryId,
        initialPageParam: 1,
    });

    // --- MUTATIONS ---
    const addContentMutation = useMutation({
        mutationFn: ({ libId, contentId, contentType }: { libId: string; contentId: string; contentType: string }) =>
            libraryApi.addContent(libId, contentId, contentType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['libraries', profileId] });
            queryClient.invalidateQueries({ queryKey: ['libraries', profileId, libraryId] });
            if (variables.contentType === 'movie') queryClient.invalidateQueries({ queryKey: ['movie', profileId, variables.contentId] });
            else queryClient.invalidateQueries({ queryKey: ['series', profileId, variables.contentId] });
        },
    });

    const removeContentMutation = useMutation({
        mutationFn: ({ libId, contentId, contentType }: { libId: string; contentId: string; contentType: string }) =>
            libraryApi.removeContent(libId, contentId, contentType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['libraries', profileId] });
            queryClient.invalidateQueries({ queryKey: ['libraries', profileId, libraryId] });
            if (variables.contentType === 'movie') queryClient.invalidateQueries({ queryKey: ['movie', profileId, variables.contentId] });
            else queryClient.invalidateQueries({ queryKey: ['series', profileId, variables.contentId] });
        },
    });

    const createLibrary = useMutation({
        mutationFn: async (name: string) => await api.post('/libraries', { name }),
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
        mutationFn: async (id: string) => await api.delete(`/libraries/${id}`),
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
