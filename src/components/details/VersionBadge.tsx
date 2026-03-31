import type { JobProgress, VideoVersionDTO } from '@duckflix/shared';
import { formatBytes, getQualityLabel } from '../../utils/format';
import { X } from 'lucide-react';

export function VersionBadge({
    v,
    activeProgress,
    cancelJob,
    canCancel,
}: {
    v: VideoVersionDTO;
    activeProgress?: JobProgress;
    canCancel: boolean;
    cancelJob: (verId: string) => unknown;
}) {
    const isProcessing = v.status === 'processing';
    const percent = activeProgress?.progress ?? 0;
    const isActivelyUpdating = !!activeProgress;

    const rawExt = v.mimeType?.split('/')[1] || '';
    const ext = rawExt.replace('x-', '').replace('msvideo', 'avi').replace('matroska', 'mkv').slice(0, 3);

    if (!isProcessing) {
        return (
            <div className="flex items-center gap-2 bg-white/3 border border-white/5 rounded-2xl px-3 py-2 hover:border-white/10 transition-all group">
                <span className="text-[11px] font-bold text-text/60 group-hover:text-text/90">
                    {getQualityLabel(v.width ?? 0, v.height)}
                </span>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-tighter">{ext}</span>
                <div className="w-px h-3 bg-white/10 mx-0.5" />
                <span className="text-[10px] text-text/30 font-medium group-hover:text-text/40">
                    {v.fileSize ? formatBytes(v.fileSize, 0) : 'N/A'}
                </span>
            </div>
        );
    }

    return (
        <div className="w-full relative bg-primary/5 border border-primary/20 rounded-3xl p-4 overflow-hidden group/card">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/card:animate-[shimmer_2s_infinite] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center bg-primary/10 rounded-xl w-10 aspect-square">
                        <span className="text-xs font-black text-primary uppercase">{getQualityLabel(v.width ?? 0, v.height, true)}</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-xs font-bold text-white/80 leading-none truncate">Processing</p>
                        <p className="text-[9px] text-white/30 font-medium mt-1 uppercase tracking-wider truncate">
                            {ext} • {v.height}p
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className="text-right">
                        <span className="font-bold text-sm text-primary">{isActivelyUpdating ? `${Math.floor(percent)}%` : 'waiting'}</span>
                    </div>

                    {canCancel && (
                        <button
                            onClick={() => cancelJob(v.id)}
                            className="flex items-center justify-center rounded-lg h-6.5 hover:bg-primary/10 text-white transition-all group-hover/card:w-6.5 w-0 overflow-hidden duration-200 cursor-pointer"
                            title="Cancel process"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className="absolute h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]"
                    style={{ width: `${isActivelyUpdating ? percent : 0}%` }}
                />
            </div>
        </div>
    );
}
