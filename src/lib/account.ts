import { AxiosError } from 'axios';
import type { AccountDTO, AccountMinDTO, ProfileDTO } from '@duckflixapp/shared';
import { api } from './api';

export const getAccountDisplayName = (account: Pick<AccountMinDTO, 'profile'> | null | undefined, fallback = 'Unknown user') =>
    account?.profile?.name ?? fallback;

export const selectProfile = (profileId: string) => api.post(`/profiles/${profileId}/select`);

const isProfileNotSelectedError = (error: unknown) =>
    error instanceof AxiosError && error.response?.status === 403 && error.response?.data?.message === 'Profile not selected';

export const fetchCurrentAccount = async () => {
    const fetchMe = async () => {
        const { account } = await api.get<{ account: AccountDTO }>('/account/@me');
        return account;
    };

    try {
        return await fetchMe();
    } catch (error) {
        if (!isProfileNotSelectedError(error)) throw error;

        const { profiles } = await api.get<{ profiles: ProfileDTO[] }>('/profiles');
        const profile = profiles[0];
        if (!profile) throw error;

        await selectProfile(profile.id);
        return fetchMe();
    }
};
