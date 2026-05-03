import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NotificationDTO } from '@duckflixapp/shared';

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { notifications } = await api.get<{ notifications: NotificationDTO[] }>('/account/notifications');
            return notifications;
        },
        placeholderData: (previousData) => previousData,
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
        onSuccess: () => queryClient.setQueryData(['notifications'], []),
    });

    return {
        notifications: query.data,
        refresh: query.refetch,
        mark: markMutation.mutate,
        isMarking: markMutation.isPending,
        clear: clearMutation.mutate,
        isClearing: clearMutation.isPending,
    };
};
