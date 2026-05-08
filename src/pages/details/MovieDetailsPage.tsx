import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { useMovieDetailed } from '../../hooks/useMovieDetailed';
import { useEffect, useState } from 'react';
import { VideoDownloadProgress } from '../../components/details/VideoDownloadProgress';
import { VideoProcessing } from '../../components/details/VideoProcessing';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLibrary } from '../../hooks/useLibrary';
import { VideoSettingsModal } from '../../components/video-settings/VideoSettingsModal';
import { VideoError } from '../../components/details/VideoError';
import { MovieDetailsTab } from '../../components/video-settings/VideoSettingsMovieDetails';
import { getTagFromVersions } from '../../utils/video';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';
import { DetailsSidebar } from '../../components/details/DetailsSidebar';
import VideoNotFound from '../../components/details/VideoNotFound';
import WatchlistButton from '../../components/buttons/WatchlistButton';
import PlayButton from '../../components/buttons/PlayButton';
import VideoOverview from '../../components/details/VideoOverview';
import { DetailsCast } from '../../components/details/DetailsCast';
import { DetailsMetadata } from '../../components/details/DetailsMetadata';
import type { SettingsTab } from '../../components/video-settings/ModalTemplate';

export default function MovieDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const auth = useAuthContext();
    const { movie, isLoading, updateMovie, isUpdating, isNotFound } = useMovieDetailed(id);
    const { addContent, removeContent } = useLibrary();
    const navigate = useNavigate();
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

    useEffect(() => {
        if (settingsParam) {
            setSearchParams((p) => {
                p.delete('settings');
                return p;
            });
        }
    }, [setSearchParams, settingsParam]);

    if (isLoading) return <DetailsSkeleton />;
    if (isNotFound) return <VideoNotFound />;
    if (!movie) return null;

    const video = movie.video;
    const versions = video.versions;
    const uploader = video.user;
    const tag = getTagFromVersions(video.versions);
    const availableVersions = versions
        .filter((v) => v.status === 'ready' || v.status === 'processing')
        .sort((a, b) => {
            if (a.status === 'ready' && b.status === 'processing') return -1;
            if (a.status === 'processing' && b.status === 'ready') return 1;
            return b.height - a.height;
        });

    const handleToWatchlist = () => {
        if (movie.inUserLibrary) removeContent({ libId: 'watchlist', contentId: movie.id, contentType: 'movie' });
        else addContent({ libId: 'watchlist', contentId: movie.id, contentType: 'movie' });
    };

    const status = movie.video.status;

    if (status === 'downloading') return <VideoDownloadProgress title={movie.title} videoId={movie.videoId} />;
    if (status === 'processing') {
        const originalVersion = movie.video.versions.find((v) => v.isOriginal) ?? null;
        return <VideoProcessing title={movie.title} originalVersion={originalVersion} />;
    }
    if (status !== 'ready') return <VideoError title={movie.title} video={movie.video} />;

    const canPlay = movie.video.versions.length > 0;

    return (
        <div className="min-h-screen pb-20">
            <div className="relative w-full aspect-21/9 min-h-140 overflow-hidden">
                <div className="absolute inset-0 rounded-tl-xl overflow-hidden">
                    {movie.bannerUrl && <img src={movie.bannerUrl} alt={movie.title} className="w-full h-full object-cover" />}

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,var(--color-background)_0%,transparent_50%)] z-10 opacity-90" />
                    <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/20 z-10" />
                </div>

                <button
                    onClick={() => navigate('/browse')}
                    className="absolute top-24 sm:top-28 left-10 md:left-16 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>

                {auth?.hasRole('contributor') && (
                    <button
                        onClick={handleOpenSettings}
                        className="absolute top-24 sm:top-28 right-10 md:right-16 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                    >
                        <Settings size={22} />
                    </button>
                )}

                <div className="absolute bottom-0 left-0 w-full px-10 py-8 md:px-16 md:py-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <DetailsMetadata
                            rating={movie.rating}
                            release={String(movie.releaseYear)}
                            runtime={movie.runtime}
                            tmdbUrl={movie.tmdbUrl}
                            chip={tag}
                        />

                        <h1 className="text-5xl md:text-7xl font-black text-white text-shadow-2xs text-shadow-black tracking-tight leading-none">
                            {movie.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {canPlay && <PlayButton videoId={movie.videoId} />}

                            <WatchlistButton onClick={handleToWatchlist} isActive={movie.inUserLibrary ?? false} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-10 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-10">
                    <VideoOverview title={'Movie Overview'} overview={movie.overview} />
                    {!!movie.genres.length && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Genres</h3>
                            <div className="flex flex-wrap gap-3">
                                {movie.genres.map((genre) => (
                                    <span
                                        onClick={() => navigate('/search?genres=' + encodeURIComponent(genre.name.toLowerCase()))}
                                        key={genre.id}
                                        className="group relative px-5 py-2 bg-white/3 border border-white/10 rounded-3xl text-sm font-medium text-text/70 transition-all duration-300 hover:border-primary/50 hover:text-primary cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative z-10 uppercase tracking-wider text-[12px]">{genre.name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <DetailsCast cast={movie.cast} />
                </div>
                <DetailsSidebar
                    videoId={video.id}
                    availableVersions={availableVersions}
                    uploader={uploader}
                    isContributor={auth?.hasRole('contributor') ?? false}
                />
            </div>
            {showSettings && (
                <VideoSettingsModal
                    videoId={video.id}
                    title={movie.title}
                    onClose={() => setShowSettings(false)}
                    onDelete={() => navigate('/browse')}
                    deleteLabel="Delete Movie"
                    initialTab={initialTab ?? undefined}
                    detailsTab={<MovieDetailsTab movie={movie} onUpdate={updateMovie} isUpdating={isUpdating} />}
                />
            )}
        </div>
    );
}
