import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SystemSettingsDTO } from '@duckflix/shared';

export const useAdmin = () => {
    const query = useQuery({
        queryKey: ['admin-system'],
        queryFn: async () => {
            const { system } = await api.get<{ system: SystemSettingsDTO }>('/admin/system');
            return system;
        },
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    return {
        system: query.data,
    };
};
