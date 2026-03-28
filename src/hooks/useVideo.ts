import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { VideoDTO } from '@duckflix/shared';
import { AxiosError } from 'axios';

export const useVideo = (id: string | undefined) => {
    const query = useQuery({
        queryKey: ['video', id],
        queryFn: async () => {
            if (!id) return null;
            const { video } = await api.get<{ video: VideoDTO }>(`/videos/${id}`);
            return video;
        },
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 3;
        },
        staleTime: 100,
        enabled: !!id,
    });

    return {
        video: query.data ?? null,
        isLoading: query.isLoading,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
    };
};
