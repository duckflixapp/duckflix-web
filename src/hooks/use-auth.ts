import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { roleHierarchy, type UserDTO, type UserRole } from '@duckflix/shared';
// import { useEffect } from 'react';

export const useAuth = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['auth-user'],
        queryFn: async () => {
            try {
                const { user } = await api.get<{ user: UserDTO }>('/users/@me');
                return user;
            } catch {
                return null;
            }
        },
        retry: false,
        staleTime: 1000,
        refetchInterval: (query) => {
            const user = query.state.data;
            return user && !user.isVerified ? 5000 : false;
        },
    });

    // useEffect(() => {
    //     if (query.data?.isVerified === true) {
    //         api.post('/auth/refresh').catch(() => {
    //             console.error('Failed to refresh token after verification');
    //         });
    //     }
    // }, [query.data?.isVerified]);

    const logout = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSuccess: () => {
            queryClient.setQueryData(['auth-user'], null);
        },
    });

    const hasRole = (role: UserRole | null) => {
        if (!role) return true;
        const userRole = query.data?.role;
        if (!userRole) return false;

        return roleHierarchy[userRole] <= roleHierarchy[role];
    };

    return {
        user: query.data ?? null,
        isVerified: query.data?.isVerified ?? false,
        isLoading: query.isLoading,
        logout: logout.mutate,
        hasRole,
    };
};
