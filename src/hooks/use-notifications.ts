import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NotificationDTO, PaginatedResponse } from '@duckflixapp/shared';

const NOTIFICATIONS_PAGE_SIZE = 10;

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const query = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: ({ pageParam = 1 }) =>
            api.get<PaginatedResponse<NotificationDTO>>('/account/notifications', {
                params: {
                    page: pageParam,
                    limit: NOTIFICATIONS_PAGE_SIZE,
                },
            }),
        getNextPageParam: (lastPage) => (lastPage.meta.currentPage < lastPage.meta.totalPages ? lastPage.meta.currentPage + 1 : undefined),
        initialPageParam: 1,
        retry: false,
    });

    const markMutation = useMutation({
        mutationKey: ['notifications-mark'],
        mutationFn: async (ids: string[]) => {
            await api.patch('/account/notifications/mark', {
                notificationIds: ids,
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const clearMutation = useMutation({
        mutationKey: ['notifications-clear'],
        mutationFn: async () => {
            await api.delete('/account/notifications');
        },
        onSuccess: () => {
            queryClient.setQueryData<InfiniteData<PaginatedResponse<NotificationDTO>>>(['notifications'], (previousData) => {
                if (!previousData) return previousData;

                return {
                    ...previousData,
                    pages: previousData.pages.map((page) => ({
                        data: [],
                        meta: {
                            ...page.meta,
                            totalItems: 0,
                            itemCount: 0,
                            totalPages: 0,
                        },
                    })),
                };
            });
        },
    });

    return {
        notifications: query.data?.pages.flatMap((page) => page.data) ?? [],
        refresh: query.refetch,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        isLoading: query.isLoading,
        mark: markMutation.mutate,
        isMarking: markMutation.isPending,
        clear: clearMutation.mutate,
        isClearing: clearMutation.isPending,
    };
};
