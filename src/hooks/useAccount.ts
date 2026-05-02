import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AccountSessionMinDTO, AccountTwoFactorStatusDTO, UserRole } from '@duckflixapp/shared';

export type AccountMeDTO = {
    id: string;
    email: string;
    role: UserRole;
    system: boolean;
    isVerified: boolean;
    isTotpEnabled: boolean;
    createdAt: string;
};

export const useAccount = () => {
    const account = useQuery({
        queryKey: ['account', 'me'],
        queryFn: async () => {
            const { account } = await api.get<{ account: AccountMeDTO }>('/account/@me');
            return account;
        },
        retry: 1,
        staleTime: 100,
        placeholderData: (previousData) => previousData,
    });

    return {
        account: account.data,
        isLoading: account.isLoading,
    };
};

export const useAccountSessions = () => {
    const sessions = useQuery({
        queryKey: ['account', 'sessions'],
        queryFn: async () => {
            const { sessions } = await api.get<{ sessions: AccountSessionMinDTO[] }>('/account/sessions');
            return sessions;
        },
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    return {
        sessions: sessions.data,
        isLoading: sessions.isLoading,
    };
};

export const useAccountTwoFa = () => {
    const twofa = useQuery({
        queryKey: ['account', '2fa'],
        queryFn: async () => {
            const data = await api.get<AccountTwoFactorStatusDTO>('/account/2fa');
            return data;
        },
        retry: false,
        staleTime: 1000,
        placeholderData: (previousData) => previousData,
    });

    return {
        twoFA: twofa.data,
        isTwoFaLoading: twofa.isLoading,
    };
};
