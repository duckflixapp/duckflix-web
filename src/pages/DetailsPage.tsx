import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Star, Clock, Calendar, ChevronLeft, Bookmark, X, Settings } from 'lucide-react';
import { useMovieDetail } from '../hooks/useMovieDetailed';
import type { JobProgress, MovieVersionDTO } from '@duckflix/shared';
import { formatBytes, getQualityLabel } from '../utils/format';
import { useEffect, useState } from 'react';
import { useMovieSocket } from '../hooks/useMovieSocket';
import { MovieDownloadProgress } from '../components/movies/MovieDownloading';
import { MovieProcessing } from '../components/movies/MovieProcessing';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuthContext } from '../contexts/AuthContext';
import { useLibrary } from '../hooks/useLibrary';
import { MovieSettingsModal, type SettingsTab } from '../components/movies/MovieSettingsModal';
import { useMovieVersions } from '../hooks/useMovieVersions';
import { MovieError } from '../components/movies/MovieError';

const getTagFromVersions = (versions: MovieVersionDTO[]) => {
    if (versions.length == 0) return null;

    const highest: number = versions.reduce((max, { height }) => (height > max ? height : max), -1);

    if (highest >= 4320) return '8K Ultra HD';
    if (highest >= 2160) return '4K Ultra HD';
    if (highest >= 1440) return '2K QHD';
    if (highest >= 1080) return 'Full HD';
    if (highest >= 720) return 'HD';
    return 'SD';
};

export default function DetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const auth = useAuthContext();
    const [showDescription, setShowDesc] = useState<boolean>(false);
    const { movie, isLoading, updateMovie, isUpdating } = useMovieDetail(id);
    const { versions } = useMovieVersions(id);
    const navigate = useNavigate();
    const { downloadProgress, progressMap } = useMovieSocket(id);
    const { addMovie, removeMovie } = useLibrary();
    const settingsParam = searchParams.get('settings');
    const [showSettings, setShowSettings] = useState(!!settingsParam);
    const [initialTab, setInitialTab] = useState<SettingsTab | null>(settingsParam === 'versions' ? 'versions' : null);

    useEffect(() => {
        if (settingsParam) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInitialTab(settingsParam === 'versions' ? 'versions' : null);
            setShowSettings(true);
            setSearchParams((p) => {
                p.delete('settings');
                return p;
            });
        }
    }, [setSearchParams, settingsParam]);

    const killJob = (verId: string) => {
        api.delete(`/tasks/movies/${verId}/kill`).catch((err) => {
            let message;
            if (err instanceof AxiosError) message = err.response?.data.message;
            toast('Error, Job kill failed', { description: message });
        });
    };

    if (isLoading) return <DetailsSkeleton />;
    if (!movie) return null;

    const tag = getTagFromVersions(movie.versions);
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

    if (movie.status === 'downloading') return <MovieDownloadProgress title={movie.title} progress={downloadProgress} />;

    if (movie.status === 'processing') return <MovieProcessing movie={movie} />;

    if (movie.status !== 'ready') return <MovieError movie={movie} />;

    const canPlay = movie.versions.length > 0;

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
                        onClick={() => setShowSettings(true)}
                        className="absolute top-8 right-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                    >
                        <Settings size={22} />
                    </button>
                )}

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex flex-wrap text-shadow-2xs text-shadow-black items-center gap-4 text-sm font-medium">
                            {movie.rating && (
                                <div className="flex items-center gap-1.5 text-yellow-500  bg-yellow-500/10 px-3 py-1 rounded-xl border border-yellow-500/20">
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
                                <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase tracking-widest text-white/40">
                                    {tag}
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white text-shadow-2xs text-shadow-black tracking-tight leading-none">
                            {movie.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {canPlay && (
                                <button
                                    onClick={() => navigate(`/watch/${movie.id}`)}
                                    className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-primary hover:bg-primary/90 text-background font-bold rounded-4xl transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                                >
                                    <Play size={20} fill="currentColor" />
                                    PLAY NOW
                                </button>
                            )}

                            <button
                                onClick={handleToWatchlist}
                                className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-white/5 text-shadow-2xs text-shadow-black hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium rounded-4xl transition-all"
                            >
                                <Bookmark size={20} fill={movie.inUserLibrary ? 'white' : 'transparent'} />
                                Watchlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-10">
                    {movie.description && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Description</h3>
                            <div className="flex flex-wrap gap-3">
                                <p
                                    onClick={() => setShowDesc((prev) => !prev)}
                                    className={`text-text/70 w-full text-sm leading-relaxed cursor-pointer ${!showDescription && 'line-clamp-3'}`}
                                >
                                    {movie.description}
                                </p>
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Genres</h3>
                        <div className="flex flex-wrap gap-3">
                            {movie.genres &&
                                movie.genres.map((genre) => (
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
                    <div>
                        <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Cast</h3>
                        <div className="flex flex-wrap gap-3"></div>
                    </div>
                </div>

                <div className="space-y-8 h-fit">
                    {movie.uploader && !movie.uploader.system && (
                        <div>
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-2">Uploaded By</h3>
                            <div className="flex items-center gap-3">
                                <p className="text-white font-medium">{movie.uploader.name}</p>

                                <span
                                    className={`text-[9px] px-2 py-0.5 rounded-xl uppercase font-bold tracking-wider ${
                                        movie.uploader.role === 'admin'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : movie.uploader.role === 'contributor'
                                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                              : 'bg-white/5 text-white/40 border border-white/10'
                                    }`}
                                >
                                    {movie.uploader.role}
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
                                    canCancel={auth?.hasRole('contributor') ?? false}
                                    cancelJob={killJob}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {showSettings && (
                <MovieSettingsModal
                    movie={movie}
                    updateMovie={updateMovie}
                    isUpdating={isUpdating}
                    onClose={() => setShowSettings(false)}
                    onMovieDeleted={() => navigate('/browse')}
                    initialTab={initialTab ?? undefined}
                />
            )}
        </div>
    );
}

function VersionBadge({
    v,
    activeProgress,
    cancelJob,
    canCancel,
}: {
    v: MovieVersionDTO;
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
                            {ext} • {v.fileSize ? formatBytes(v.fileSize, 0) : 'Calculating...'}
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

function DetailsSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="h-[70vh] bg-white/5 w-full" />
            <div className="p-16 space-y-4">
                <div className="h-10 bg-white/5 w-1/3 rounded-lg" />
                <div className="h-6 bg-white/5 w-1/2 rounded-lg" />
            </div>
        </div>
    );
}
