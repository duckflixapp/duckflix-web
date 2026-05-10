import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { useState } from 'react';

import { useEpisodeDetailed } from '../../hooks/useEpisodeDetails';
import { useAuthContext } from '../../contexts/AuthContext';

import { VideoSettingsModal } from '../../components/video-settings/VideoSettingsModal';
import { getTagFromVersions } from '../../utils/video';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';
import { DetailsSidebar } from '../../components/details/DetailsSidebar';
import { VideoDownloadProgress } from '../../components/details/VideoDownloadProgress';
import { VideoProcessing } from '../../components/details/VideoProcessing';
import { VideoError } from '../../components/details/VideoError';
import VideoNotFound from '../../components/details/VideoNotFound';
import { EpisodeDetailsTab } from '../../components/video-settings/VideoSettingsEpisodeDetails';
import PlayButton from '../../components/buttons/PlayButton';
import VideoOverview from '../../components/details/VideoOverview';
import { DetailsCast } from '../../components/details/DetailsCast';
import { DetailsMetadata } from '../../components/details/DetailsMetadata';
import type { SettingsTab } from '../../components/video-settings/ModalTemplate';

export default function EpisodeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = useAuthContext();

    const { episode, isNotFound, isLoading } = useEpisodeDetailed(id);

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
    const versions = video.versions;
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
                    className="absolute top-24 sm:top-28 left-10 md:left-16 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Settings Button */}
                {isContributor && (
                    <button
                        onClick={handleOpenSettings}
                        className="absolute top-24 sm:top-28 right-10 md:right-16 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white drop-shadow-xl hover:bg-white/10 transition-all z-30 cursor-pointer"
                    >
                        <Settings size={22} className="drop-shadow-xl" />
                    </button>
                )}

                <div className="absolute bottom-0 left-0 w-full px-10 py-8 md:px-16 md:py-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <DetailsMetadata
                            tag={`S${episode.season.seasonNumber}.E${episode.episodeNumber}`}
                            release={episode.airDate ? new Date(episode.airDate).toLocaleDateString() : null}
                            runtime={episode.runtime}
                            tmdbUrl={episode.tmdbUrl}
                            rating={episode.rating}
                            chip={tag}
                        />

                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">{episode.name}</h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {canPlay && <PlayButton videoId={episode.videoId} title="Play Episode" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="mx-auto px-10 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-10">
                    <VideoOverview title={'Episode Overview'} overview={episode.overview} />
                    <DetailsCast cast={episode.cast} />
                </div>

                <DetailsSidebar
                    videoId={video.id}
                    availableVersions={availableVersions}
                    uploader={video.user}
                    isContributor={isContributor}
                />
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <VideoSettingsModal
                    videoId={video.id}
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
