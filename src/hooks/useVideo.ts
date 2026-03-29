import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { VideoDTO, VideoResolved } from '@duckflix/shared';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export const useVideo = (id: string | undefined) => {
    const queryClient = useQueryClient();

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

    const deleteVideo = useMutation({
        mutationFn: async () => await api.delete(`/videos/${id}`),
        onSuccess: () => {
            toast.success('Video deleted');
            queryClient.invalidateQueries({ queryKey: ['video', id] });
            queryClient.invalidateQueries({ queryKey: ['movie'] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete video', { description: message });
        },
    });

    const resolveQuery = useQuery({
        queryKey: ['video', id, 'resolve'],
        queryFn: async () => {
            const { content } = await api.get<{ content: VideoResolved }>(`/videos/${id}/resolve`);
            return content;
        },
        enabled: !!id,
    });

    return {
        video: query.data ?? null,
        isLoading: query.isLoading,
        isNotFound: query.error instanceof AxiosError && query.error.response?.status === 404,
        videoResolved: resolveQuery.data ?? null,
        videoResolving: resolveQuery.isLoading,
        deleteVideo: deleteVideo.mutate,
        isDeletingVideo: deleteVideo.isPending,
    };
};
