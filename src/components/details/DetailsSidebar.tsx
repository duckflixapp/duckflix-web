import type { UserMinDTO, VideoVersionDTO } from '@duckflix/shared';
import { VersionBadge } from './VersionBadge';
import { api } from '../../lib/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useVideoSocket } from '../../hooks/useVideoSocket';

export function DetailsSidebar({
    videoId,
    availableVersions,
    uploader,
    isContributor,
}: {
    videoId: string;
    availableVersions: VideoVersionDTO[];
    uploader: UserMinDTO | null;
    isContributor: boolean;
}) {
    const { progressMap } = useVideoSocket(videoId);

    const killJob = (verId: string) => {
        api.delete(`/tasks/videoVersion/${verId}/kill`).catch((err) => {
            let message;
            if (err instanceof AxiosError) message = err.response?.data.message;
            toast('Error, Job kill failed', { description: message });
        });
    };

    return (
        <div className="space-y-8 h-fit">
            {uploader && !uploader.system && (
                <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-2">Uploaded By</h3>
                    <div className="flex items-center gap-3">
                        <p className="text-white font-medium">{uploader.name}</p>

                        <span
                            className={`text-[9px] px-2 py-0.5 rounded-xl uppercase font-bold tracking-wider ${
                                uploader.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : uploader.role === 'contributor'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : 'bg-white/5 text-white/40 border border-white/10'
                            }`}
                        >
                            {uploader.role}
                        </span>
                    </div>
                </div>
            )}
            <div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Available Qualities</h3>
                <div className="flex flex-wrap gap-2">
                    {availableVersions.map((v) => (
                        <VersionBadge
                            key={v.id}
                            v={v}
                            activeProgress={progressMap.get(v.id)}
                            canCancel={isContributor}
                            cancelJob={killJob}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
