import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AccountTwoFactorStatusDTO } from '@duckflixapp/shared';

export const useAccount = () => {
    const query = useQuery({
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
        twoFA: query.data,
    };
};
