import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Clock, Calendar, ChevronLeft, Bookmark } from 'lucide-react';
import { useMovieDetail } from '../hooks/use-movie-detailed';
import type { MovieVersionDTO } from '@duckflix/shared';
import { formatBytes } from '../utils/format';

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
    const navigate = useNavigate();

    const { data, isLoading } = useMovieDetail(id);
    const movie = data;

    if (isLoading) return <DetailsSkeleton />;
    if (!movie) return null;

    const tag = getTagFromVersions(movie.versions);

    if (movie.status !== 'ready') return <p>{JSON.stringify(movie)}</p>;

    return (
        <div className="min-h-screen pb-20">
            <div className="relative w-full aspect-21/9 min-h-140 overflow-hidden">
                <div className="absolute inset-0 rounded-tl-xl overflow-hidden">
                    <img src={movie.bannerUrl ?? ''} alt={movie.title} className="w-full h-full object-cover" />

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

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                            {movie.rating && (
                                <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                    <Star size={16} fill="currentColor" />
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

                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">{movie.title}</h1>

                        {movie.description && (
                            <p className="text-lg text-text/70 max-w-2xl line-clamp-3 md:line-clamp-none leading-relaxed">
                                {movie.description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={() => navigate(`/watch/${movie.id}`)}
                                className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-primary hover:bg-primary/90 text-background font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                            >
                                <Play size={20} fill="currentColor" />
                                PLAY NOW
                            </button>

                            <button className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium rounded-2xl transition-all">
                                <Bookmark size={20} />
                                Add to My List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <div>
                        <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Genres</h3>
                        <div className="flex flex-wrap gap-3">
                            {movie.genres &&
                                movie.genres.map((genre) => (
                                    <span
                                        key={genre.id}
                                        className="group relative px-5 py-2 bg-white/3 border border-white/10 rounded-xl text-sm font-medium text-text/70 transition-all duration-300 hover:border-primary/50 hover:text-primary cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative z-10 uppercase tracking-wider text-[12px]">{genre.name}</span>
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8 p-8 h-fit">
                    <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-2">Uploaded By</h3>
                        <p className="text-white font-medium">{movie.user.name}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Available Qualities</h3>
                        <div className="flex flex-wrap gap-2">
                            {movie.versions.map((v) => {
                                const rawExt = v.mimeType?.split('/')[1] || '';
                                const ext = rawExt.replace('x-', '').replace('msvideo', 'avi').replace('matroska', 'mkv').slice(0, 3);

                                return (
                                    <div
                                        key={v.id}
                                        title={v.isOriginal ? 'Original' : undefined}
                                        className="group flex items-center bg-white/3 border border-white/5 rounded-lg px-2.5 py-1.5 hover:border-white/20 transition-all cursor-default"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-text/70 group-hover:text-text">{v.height}p</span>

                                            <span className="text-[9px] text-white/20 font-black uppercase tracking-tighter group-hover:text-white/40">
                                                {ext}
                                            </span>
                                        </div>

                                        <div className="mx-2 w-px h-3 bg-white/10" />

                                        <span className="text-[10px] text-text/30 font-medium group-hover:text-text/50">
                                            {v.fileSize ? formatBytes(v.fileSize, 0) : 'N/A'}
                                        </span>

                                        {v.isOriginal && (
                                            <div className="ml-1.5 w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
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
