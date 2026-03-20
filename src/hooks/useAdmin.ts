import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { SystemSettingsDTO, SystemStatisticsDTO } from '@duckflix/shared';

export const useAdmin = () => {
    const systemQuery = useQuery({
        queryKey: ['admin', 'system'],
        queryFn: async () => {
            const { system } = await api.get<{ system: SystemSettingsDTO }>('/admin/system');
            return system;
        },
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    const statsQuery = useQuery({
        queryKey: ['admin', 'statistics'],
        queryFn: async () => {
            const { statistics } = await api.get<{ statistics: SystemStatisticsDTO }>('/admin/stats');
            console.log(statistics);
            return statistics;
        },
        refetchInterval: 10_000,
        retry: false,
    });

    return {
        system: systemQuery.data ?? null,
        isSystemLoading: systemQuery.isLoading,
        stats: statsQuery.data ?? null,
        isStatsLoading: statsQuery.isLoading,
    };
};
