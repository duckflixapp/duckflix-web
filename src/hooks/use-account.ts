import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AccountSessionMinDTO, AccountTwoFactorStatusDTO } from '@duckflixapp/shared';

export const useAccount = () => {
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
        twoFA: twofa.data,
        sessions: sessions.data,
    };
};
