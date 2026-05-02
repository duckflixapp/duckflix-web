import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProfileDTO } from '@duckflixapp/shared';

export const useProfile = () => {
    const queryClient = useQueryClient();

    const profile = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const { profile } = await api.get<{ profile: ProfileDTO }>('/profiles/@me').catch((_) => ({ profile: null }));
            return profile;
        },
        retry: false,
        staleTime: 100,
        placeholderData: (previousData) => previousData,
    });

    const selectProfile = useMutation({
        mutationFn: (profileId: string) => api.post(`/profiles/${profileId}/select`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['library'] });
            queryClient.invalidateQueries({ queryKey: ['movie'] });
            queryClient.invalidateQueries({ queryKey: ['series'] });
        },
    });

    const logoutProfile = useMutation({
        mutationFn: () => api.post(`/profiles/logout`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['library'] });
            queryClient.invalidateQueries({ queryKey: ['movie'] });
            queryClient.invalidateQueries({ queryKey: ['series'] });
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
