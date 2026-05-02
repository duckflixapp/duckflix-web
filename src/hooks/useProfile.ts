import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProfileDTO } from '@duckflixapp/shared';
import { AxiosError } from 'axios';

type SelectProfileResult = {
    token: string;
    profile: ProfileDTO;
};

export const useProfile = () => {
    const queryClient = useQueryClient();

    const profile = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const { profile } = await api.get<{ profile: ProfileDTO }>('/profiles/@me').catch((e) => {
                if (e instanceof AxiosError && e.response?.status === 403) return { profile: null };
                throw e;
            });
            return profile;
        },
        retry: false,
        staleTime: 100,
        placeholderData: (previousData) => previousData,
    });

    const selectProfile = useMutation({
        mutationFn: (profileId: string) => api.post<SelectProfileResult>(`/profiles/${profileId}/select`),
        onSuccess: ({ profile }) => {
            queryClient.setQueryData(['profile', 'me'], profile);
        },
    });

    const logoutProfile = useMutation({
        mutationFn: () => api.post(`/profiles/logout`),
        onSuccess: () => {
            queryClient.setQueryData(['profile', 'me'], null);
        },
    });

    return {
        profile: profile.data,
        isLoading: profile.isLoading,
        selectProfile: selectProfile.mutate,
        logout: logoutProfile.mutate,
    };
};

export const useProfiles = () => {
    const profiles = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { profiles } = await api.get<{ profiles: ProfileDTO[] }>(`/profiles/`);
            return profiles;
        },
    });

    return {
        profiles: profiles.data ?? [],
        isLoading: profiles.isLoading,
    };
};
