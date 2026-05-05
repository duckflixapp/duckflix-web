import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProfileDTO } from '@duckflixapp/shared';
import { AxiosError } from 'axios';

type SelectProfileResult = {
    token: string;
    profile: ProfileDTO;
};

type SelectProfileInput = {
    profileId: string;
    pin?: string;
};

type CreateProfileInput = {
    name: string;
    avatarAssetId: string | null;
    pin?: string;
};

type UpdateProfilePinInput = {
    pin: string;
    currentPin?: string;
};

type DeleteProfileInput = {
    pin?: string;
};

export type ProfileAvatarDTO = {
    id: string | null;
    url: string | null;
};

export const useProfile = (enabled = true) => {
    const queryClient = useQueryClient();

    const profile = useQuery({
        queryKey: ['profile', 'me'],
        enabled,
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
        mutationFn: ({ profileId, pin }: SelectProfileInput) => api.post<SelectProfileResult>(`/profiles/${profileId}/select`, { pin }),
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
        selectProfileAsync: selectProfile.mutateAsync,
        isSelectingProfile: selectProfile.isPending,
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

export const useProfileAvatars = (enabled = true) => {
    const avatars = useQuery({
        queryKey: ['profile', 'avatars'],
        enabled,
        queryFn: async () => {
            const { avatars } = await api.get<{ avatars: ProfileAvatarDTO[] }>('/profiles/avatars');
            return avatars;
        },
    });

    return {
        avatars: avatars.data ?? [],
        isLoading: avatars.isLoading,
    };
};

export const useCreateProfile = () => {
    const queryClient = useQueryClient();

    const createProfile = useMutation({
        mutationFn: (data: CreateProfileInput) => api.post<SelectProfileResult>('/profiles/', data),
        onSuccess: ({ profile }) => {
            queryClient.setQueryData(['profile', 'me'], profile);
            queryClient.setQueryData<ProfileDTO[]>(['profile'], (profiles) => (profiles ? [...profiles, profile] : [profile]));
        },
    });

    return {
        createProfile: createProfile.mutate,
        createProfileAsync: createProfile.mutateAsync,
        isCreating: createProfile.isPending,
    };
};

export const useDeleteProfile = () => {
    const queryClient = useQueryClient();

    const deleteProfile = useMutation({
        mutationFn: (data: DeleteProfileInput = {}) => api.post<{ token: string }>('/profiles/@me/delete', { ...data }),
        onMutate: () => {
            queryClient.setQueryData(['profile', 'me'], null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['libraries'] });
        },
    });

    return {
        deleteProfile: deleteProfile.mutateAsync,
        isDeletingProfile: deleteProfile.isPending,
    };
};

export const useProfilePin = () => {
    const queryClient = useQueryClient();
    const updateProfileCaches = (profile: ProfileDTO) => {
        queryClient.setQueryData(['profile', 'me'], profile);
        queryClient.setQueryData<ProfileDTO[]>(
            ['profile'],
            (profiles) => profiles?.map((item) => (item.id === profile.id ? profile : item)) ?? profiles
        );
    };

    const updatePin = useMutation({
        mutationFn: (data: UpdateProfilePinInput) => api.patch<{ profile: ProfileDTO }>('/profiles/@me/pin', data),
        onSuccess: ({ profile }) => {
            updateProfileCaches(profile);
        },
    });

    const removePin = useMutation({
        mutationFn: (pin: string) => api.delete<{ profile: ProfileDTO }>('/profiles/@me/pin', { data: { pin } }),
        onSuccess: ({ profile }) => {
            updateProfileCaches(profile);
        },
    });

    return {
        updatePin: updatePin.mutateAsync,
        removePin: removePin.mutateAsync,
        isUpdatingPin: updatePin.isPending,
        isRemovingPin: removePin.isPending,
    };
};
