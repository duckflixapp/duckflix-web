import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserDTO } from '@duckflix/shared';

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
    });

    const logout = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSuccess: () => {
            queryClient.setQueryData(['auth-user'], null);
        },
    });

    return {
        user: query.data,
        isLoading: query.isLoading,
        logout: logout.mutate,
    };
};
