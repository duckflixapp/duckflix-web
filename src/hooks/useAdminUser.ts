import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserDTO, UserRole } from '@duckflix/shared';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export const useAdminUsers = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { users } = await api.get<{ users: UserDTO[] }>('/admin/users');
            return users;
        },
    });

    const updateRole = useMutation({
        mutationFn: async ({ email, role }: { email: string; role: UserRole }) => {
            await api.patch('/admin/users', { email, role });
        },
        onSuccess: (_, { email }) => {
            toast.success(`Role updated for ${email}`);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Error updating role.', { description: message });
        },
    });

    const deleteUser = useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            await api.delete('/admin/users', { data: { email } });
        },
        onSuccess: (_, { email }) => {
            toast.success(`User ${email} deleted`);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Error deleting user.', { description: message });
        },
    });

    return {
        users: query.data ?? [],
        loading: query.isLoading,
        updateRole: updateRole.mutate,
        isUpdating: updateRole.isPending,
        deleteUser: deleteUser.mutate,
        isDeleting: deleteUser.isPending,
    };
};
