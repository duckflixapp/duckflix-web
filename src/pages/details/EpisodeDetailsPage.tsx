import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Calendar, ChevronLeft, Settings } from 'lucide-react';
import { useState } from 'react';

import { useEpisodeDetailed } from '../../hooks/useEpisodeDetails';
import { useVideoVersions } from '../../hooks/useVideoVersions';
import { useAuthContext } from '../../contexts/AuthContext';

import { VideoSettingsModal, type SettingsTab } from '../../components/video-settings/VideoSettingsModal';
import { getTagFromVersions } from '../../utils/video';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';
import { DetailsSidebar } from '../../components/details/DetailsSidebar';
import { VideoDownloadProgress } from '../../components/details/VideoDownloadProgress';
import { VideoProcessing } from '../../components/details/VideoProcessing';
import { VideoError } from '../../components/details/VideoError';
import VideoNotFound from '../../components/details/VideoNotFound';
import { EpisodeDetailsTab } from '../../components/video-settings/VideoSettingsEpisodeDetails';
import PlayButton from '../../components/buttons/PlayButton';

export default function EpisodeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = useAuthContext();

    const [showDescription, setShowDesc] = useState<boolean>(false);

    const { episode, isNotFound, isLoading } = useEpisodeDetailed(id);
    const { versions } = useVideoVersions(episode?.videoId);

    const settingsParam = searchParams.get('settings');
    const [showSettings, setShowSettings] = useState(!!settingsParam);
    const [initialTab, setInitialTab] = useState<SettingsTab | null>(settingsParam === 'versions' ? 'versions' : null);

    const handleOpenSettings = () => {
        setInitialTab(settingsParam === 'versions' ? 'versions' : null);
        setShowSettings(true);
        setSearchParams((p) => {
            p.delete('settings');
            return p;
        });
    };

    if (isLoading) return <DetailsSkeleton />;
    if (isNotFound) return <VideoNotFound />;
    if (!episode || !episode.video) return null;

    const video = episode.video;
    const tag = getTagFromVersions(video?.versions || []);
    const availableVersions = versions.filter((v) => v.status === 'ready' || v.status === 'processing').sort((a, b) => b.height - a.height);

    if (video.status === 'downloading') return <VideoDownloadProgress title={episode.name} videoId={episode.videoId} />;
    if (video.status === 'processing') {
        const originalVersion = episode.video.versions.find((v) => v.isOriginal) ?? null;
        return <VideoProcessing title={episode.name} originalVersion={originalVersion} />;
    }
    if (video.status !== 'ready') return <VideoError title={episode.name} video={episode.video} />;

    const canPlay = !!video.versions.length;

    const isContributor = auth?.hasRole('contributor') ?? false;

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative w-full aspect-21/9 min-h-140 overflow-hidden">
                <div className="absolute inset-0 rounded-tl-xl overflow-hidden">
                    {episode.stillUrl ? (
                        <img src={episode.stillUrl} alt={episode.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-primary/5" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(`/details/season/${episode.seasonId}`)}
                    className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Settings Button */}
                {isContributor && (
                    <button
                        onClick={handleOpenSettings}
                        className="absolute top-8 right-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white drop-shadow-xl hover:bg-white/10 transition-all z-30 cursor-pointer"
                    >
                        <Settings size={22} className="drop-shadow-xl" />
                    </button>
                )}

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-sm font-bold uppercase tracking-widest">
                                S{episode.season.seasonNumber}.E{episode.episodeNumber}
                            </span>
                            {episode.airDate && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Calendar size={16} />
                                    <span>{new Date(episode.airDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {episode.runtime && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Clock size={16} />
                                    <span>{episode.runtime}m</span>
                                </div>
                            )}
                            {tag && (
                                <span className="px-2 py-0.5 border border-white/20 rounded-xl text-[10px] uppercase text-white/40">
                                    {tag}
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">{episode.name}</h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {canPlay && <PlayButton videoId={episode.videoId} title="Play Episode" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-10">
                    {episode.overview && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Episode Overview</h3>
                            <p
                                onClick={() => setShowDesc(!showDescription)}
                                className={`text-text/70 text-sm leading-relaxed cursor-pointer ${!showDescription && 'line-clamp-4'}`}
                            >
                                {episode.overview}
                            </p>
                        </div>
                    )}
                </div>

                <DetailsSidebar
                    videoId={video.id}
                    availableVersions={availableVersions}
                    uploader={video.uploader}
                    isContributor={isContributor}
                />
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <VideoSettingsModal
                    video={video}
                    title={episode.name}
                    onClose={() => setShowSettings(false)}
                    onDelete={() => navigate(`/details/season/${episode.seasonId}`)}
                    deleteLabel="Delete Episode"
                    initialTab={initialTab ?? undefined}
                    detailsTab={<EpisodeDetailsTab />}
                />
            )}
        </div>
    );
}
