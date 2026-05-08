import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Antenna, Loader2, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useVideoSocket } from '../../hooks/useVideoSocket';
import { api } from '../../lib/api';

export function VideoDownloadProgress({ title, videoId }: { title: string; videoId: string }) {
    const { downloadProgress: progress } = useVideoSocket(videoId);
    const queryClient = useQueryClient();

    const cancelDownload = useMutation({
        mutationFn: async () => {
            await api.delete<void>(`/videos/${videoId}/download`);
        },
        onSuccess: () => {
            toast.success('Torrent download cancelled');
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            queryClient.invalidateQueries({ queryKey: ['movie'] });
            queryClient.invalidateQueries({ queryKey: ['episode'] });
        },
        onError: (err) => {
            const message = err instanceof AxiosError ? err.response?.data.message : undefined;
            toast.error('Failed to cancel torrent download', { description: message });
        },
    });

    const percent = progress?.percent ?? 0;

    return (
        <div className="relative h-full flex flex-col items-center justify-center text-text overflow-hidden">
            <div className="absolute top-[40%] right-[-10%] transition-all duration-300 sm:w-75 sm:h-75 md:w-100 md:h-100 lg:w-150 lg:h-150 bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-2xl px-12 space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white/90">{title}</h1>
                    <div className="flex items-center justify-center gap-3 text-white/30">
                        <Loader2 size={14} className="animate-spin text-primary/60" />
                        <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Downloading content</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-end justify-between px-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{Math.floor(percent)}</span>
                            <span className="text-xl font-bold text-primary/80">.{(percent % 1).toFixed(2).split('.')[1]}%</span>
                        </div>

                        <div className="flex gap-6 mb-1">
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-wider text-white/20 font-bold">Speed</p>
                                <p className="text-sm font-bold text-white/70 tabular-nums">{progress?.speed ?? '0 KB/s'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-wider text-white/20 font-bold">ETA</p>
                                <p className="text-sm font-bold text-white/70 tabular-nums">{progress?.eta ?? '--:--'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-white/30">
                            <Users size={12} className="text-white/20" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{progress?.peers.active ?? 0} Peers</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2 text-white/30">
                            <Antenna size={12} className="text-white/20" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {progress?.peers.connecting ?? 0} Connecting
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => cancelDownload.mutate()}
                            disabled={cancelDownload.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-red-500/10 disabled:hover:bg-white/5 border border-white/10 hover:border-red-500/30 disabled:hover:border-white/10 text-red-400 disabled:text-white/30 text-xs font-bold uppercase tracking-wider rounded-3xl transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                            {cancelDownload.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            Cancel Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
