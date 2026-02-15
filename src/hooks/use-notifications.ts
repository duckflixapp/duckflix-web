import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NotificationDTO } from '@duckflix/shared';

export const useNotifications = () => {
    const query = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { notifications } = await api.get<{ notifications: NotificationDTO[] }>('/users/@me/notifications');
            return notifications;
        },
        placeholderData: (previousData) => previousData,
    });

    return {
        notifications: query.data,
        clear: () => {},
    };
};
