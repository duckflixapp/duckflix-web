import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { roleHierarchy, type UserRole } from '@duckflixapp/shared';
import { stepUpStore } from '../lib/step-up-store';
import { useState } from 'react';
import { useAccount } from './useAccount';
import { useProfile } from './useProfile';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const { account, isLoading } = useAccount();
    const { profile } = useProfile();
    const [stepUpActive, setStepUpActive] = useState(false);

    const logout = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSuccess: () => {
            queryClient.setQueryData(['account', 'me'], null);
            queryClient.setQueryData(['profile', 'me'], null);
        },
    });

    const hasRole = (role: UserRole | null) => {
        if (!role) return true;
        const userRole = account?.role;
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
        account: account ?? null,
        isVerified: account?.isVerified ?? false,
        isLoading,
        logout: logout.mutate,
        hasRole,
        hasSelectedProfile: !!profile,
        profile,
        isStepupActive: stepUpActive,
        hasStepUp,
        applyStepUp,
        clearStepUp,
    };
};
