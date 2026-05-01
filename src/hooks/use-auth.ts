import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { roleHierarchy, type UserRole } from '@duckflixapp/shared';
import { stepUpStore } from '../lib/step-up-store';
import { useState } from 'react';
import { fetchCurrentAccount } from '../lib/account';
// import { useEffect } from 'react';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const [stepUpActive, setStepUpActive] = useState(false);

    const query = useQuery({
        queryKey: ['auth-user'],
        queryFn: async () => {
            try {
                return await fetchCurrentAccount();
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

    const applyStepUp = (token: string, expiresIn: number) => {
        stepUpStore.set(token, expiresIn);
        setStepUpActive(true);
    };

    const clearStepUp = () => {
        stepUpStore.clear();
        setStepUpActive(false);
    };

    const hasStepUp = () => stepUpStore.get() !== null;

    return {
        user: query.data ?? null,
        isVerified: query.data?.isVerified ?? false,
        isLoading: query.isLoading,
        logout: logout.mutate,
        hasRole,
        hasSelectedProfile: !!query.data && !!query.data.profile,
        isStepupActive: stepUpActive,
        hasStepUp,
        applyStepUp,
        clearStepUp,
    };
};
