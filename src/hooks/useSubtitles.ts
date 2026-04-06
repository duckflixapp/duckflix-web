import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { SubtitleDTO, SubtitleSearchResultDTO } from '@duckflixapp/shared';

export const useSubtitles = (videoId: string | undefined) => {
    const queryClient = useQueryClient();

    const searchSubtitles = useMutation({
        mutationFn: async (language: string) => {
            if (!videoId) return [];
            const { subtitles } = await api.get<{ subtitles: SubtitleSearchResultDTO[] }>(`/videos/${videoId}/subtitles/search`, {
                params: { language },
            });
            return subtitles;
        },
    });

    const importSubtitle = useMutation({
        mutationFn: async ({ fileId }: { fileId: number }) => {
            if (!videoId) return null;
            const { subtitle } = await api.post<{ subtitle: SubtitleDTO }>(`/videos/${videoId}/subtitles/import`, { fileId });
            return subtitle;
        },
        onSuccess: () => {
            toast.success('Subtitle imported');
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to import subtitle', { description: message });
        },
    });

    const uploadSubtitle = useMutation({
        mutationFn: async ({ file, language }: { file: File; language: string }) => {
            if (!videoId) return null;
            const form = new FormData();
            form.append('subtitle', file);
            form.append('language', language);
            const { subtitle } = await api.post<{ subtitle: SubtitleDTO }>(`/videos/${videoId}/subtitles`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return subtitle;
        },
        onSuccess: () => {
            toast.success('Subtitle uploaded');
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to upload subtitle', { description: message });
        },
    });

    const deleteSubtitle = useMutation({
        mutationFn: async (subtitleId: string) => {
            await api.delete(`/videos/${videoId}/subtitles/${subtitleId}`);
        },
        onSuccess: () => {
            toast.success('Subtitle deleted');
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to delete subtitle', { description: message });
        },
    });

    return {
        search: searchSubtitles.mutateAsync,
        isSearching: searchSubtitles.isPending,
        import: importSubtitle.mutateAsync,
        isImporting: importSubtitle.isPending,
        upload: uploadSubtitle.mutate,
        isUploading: uploadSubtitle.isPending,
        delete: deleteSubtitle.mutate,
        isDeleting: deleteSubtitle.isPending,
    };
};
