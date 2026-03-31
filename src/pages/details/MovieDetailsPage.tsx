import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Clock, Calendar, ChevronLeft, Settings } from 'lucide-react';
import { useMovieDetailed } from '../../hooks/useMovieDetailed';
import { useEffect, useState } from 'react';
import { VideoDownloadProgress } from '../../components/details/VideoDownloadProgress';
import { VideoProcessing } from '../../components/details/VideoProcessing';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLibrary } from '../../hooks/useLibrary';
import { VideoSettingsModal, type SettingsTab } from '../../components/video-settings/VideoSettingsModal';
import { useVideoVersions } from '../../hooks/useVideoVersions';
import { VideoError } from '../../components/details/VideoError';
import { MovieDetailsTab } from '../../components/video-settings/VideoSettingsMovieDetails';
import { getTagFromVersions } from '../../utils/video';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';
import { DetailsSidebar } from '../../components/details/DetailsSidebar';
import VideoNotFound from '../../components/details/VideoNotFound';
import WatchlistButton from '../../components/buttons/WatchlistButton';
import PlayButton from '../../components/buttons/PlayButton';
import VideoOverview from '../../components/details/VideoOverview';

export default function MovieDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const auth = useAuthContext();
    const { movie, isLoading, updateMovie, isUpdating, isNotFound } = useMovieDetailed(id);
    const { versions } = useVideoVersions(movie?.videoId);
    const navigate = useNavigate();
    const { addMovie, removeMovie } = useLibrary();
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
    const uploader = video.uploader;
    const tag = getTagFromVersions(video.versions);
    const availableVersions = versions
        .filter((v) => v.status === 'ready' || v.status === 'processing')
        .sort((a, b) => {
            if (a.status === 'ready' && b.status === 'processing') return -1;
            if (a.status === 'processing' && b.status === 'ready') return 1;
            return b.height - a.height;
        });

    const handleToWatchlist = () => {
        if (movie.inUserLibrary) removeMovie({ libId: 'watchlist', movieId: movie.id });
        else addMovie({ libId: 'watchlist', movieId: movie.id });
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
                    className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>

                {auth?.hasRole('contributor') && (
                    <button
                        onClick={handleOpenSettings}
                        className="absolute top-8 right-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                    >
                        <Settings size={22} />
                    </button>
                )}

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex flex-wrap text-shadow-2xs text-shadow-black items-center gap-4 text-sm font-medium">
                            {movie.rating && (
                                <div className="flex items-center gap-1.5 text-yellow-500  bg-yellow-500/10 px-3 py-1 rounded-2xl border border-yellow-500/20">
                                    <Star size={15} fill="currentColor" />
                                    <span>{movie.rating}</span>
                                </div>
                            )}
                            {movie.releaseYear && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Calendar size={16} />
                                    <span>{movie.releaseYear}</span>
                                </div>
                            )}
                            {movie.duration && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Clock size={16} />
                                    <span>
                                        {Math.floor(movie.duration / 3600)}h {Math.ceil(movie.duration / 60) % 60}m
                                    </span>
                                </div>
                            )}
                            {tag && (
                                <span className="px-2.5 py-1 border border-white/20 rounded-2xl text-[10px] uppercase tracking-widest text-white/40">
                                    {tag}
                                </span>
                            )}
                        </div>

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

            <div className="mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-10">
                    <VideoOverview title={'Movie Overview'} overview={movie.overview} />
                    {!!movie.genres.length && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Genres</h3>
                            <div className="flex flex-wrap gap-3">
                                {movie.genres.map((genre) => (
                                    <span
                                        onClick={() => navigate('/search?genre=' + encodeURIComponent(genre.id))}
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
                    {/* <div>
                        <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Cast</h3>
                        <div className="flex flex-wrap gap-3"></div>
                    </div> */}
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
                    video={video}
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
