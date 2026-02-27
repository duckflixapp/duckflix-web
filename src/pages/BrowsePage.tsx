import type { MovieDTO } from '@duckflix/shared';
import { useBestRatedMovies, useRecentMovies } from '../hooks/useMovies';
import { Play, Info, Star, UploadCloud, Plus, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from '../components/movies/MovieCard';
import { useAuthContext } from '../contexts/AuthContext';

export default function BrowsePage() {
    const { data: recentMovies, isLoading: recentLoading } = useRecentMovies({ page: 1, limit: 12 });
    const { data: bestRatedMovies, isLoading: bestRatedLoading } = useBestRatedMovies({ page: 1, limit: 12 });
    const auth = useAuthContext();
    const navigate = useNavigate();

    const openDetails = (movie: MovieDTO) => navigate(`/details/${movie.id}`);
    const openWatch = (movie: MovieDTO) => navigate(`/watch/${movie.id}`);

    const heroMovie: MovieDTO | null = recentMovies?.length ? recentMovies[0] : null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative w-full h-full">
            <div
                className="absolute top-[10%] left-[30%] w-125 h-125 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"
                style={{ animationDuration: '8s' }}
            />
            {!recentMovies && <EmptyState canUpload={auth?.hasRole('contributor') ?? false} onNavigate={() => navigate('/upload')} />}
            <HeroSection loading={recentLoading} movie={heroMovie} onOpenDetails={openDetails} onOpenWatch={openWatch} />
            <div className="flex flex-col px-8 py-12 gap-8">
                {recentMovies && (
                    <MovieListSection title="Recently Added" movies={recentMovies} loading={recentLoading} onOpenDetails={openDetails} />
                )}
                {bestRatedMovies && (
                    <MovieListSection title="Best Rated" movies={bestRatedMovies} loading={bestRatedLoading} onOpenDetails={openDetails} />
                )}
            </div>
        </div>
    );
}

function MovieListSection({
    title,
    movies,
    loading: isLoading,
    onOpenDetails: openDetails,
}: {
    title: string;
    movies: MovieDTO[];

    loading: boolean;
    onOpenDetails: (movie: MovieDTO) => void;
}) {
    return (
        <section className="relative z-10">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-xl md:text-2xl font-bold font-poppins tracking-tight text-text">{title}</h2>
                <div className="h-1 w-12 bg-primary rounded-full" />
            </div>

            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 custom-scrollbar snap-x snap-mandatory scroll-smooth">
                    <MovieList loading={isLoading} movies={movies} onOpenDetails={openDetails} />
                </div>

                <div className="absolute -right-8 top-0 bottom-6 w-16 bg-linear-to-r from-transparent to-background pointer-events-none z-20" />
            </div>
        </section>
    );
}

function MovieList({
    loading: isLoading,
    movies,
    onOpenDetails: openDetails,
}: {
    loading: boolean;
    movies: MovieDTO[];
    onOpenDetails: (movie: MovieDTO) => void;
}) {
    if (isLoading)
        return Array(12)
            .fill(0)
            .map((_, i) => <MovieSkeleton key={i} />);

    return movies.map((movie) => (
        <div key={movie.id} className="flex-none w-35 md:w-50 snap-start transition-all py-4">
            <MovieCard movie={movie} onClick={() => openDetails(movie)} />
        </div>
    ));
}

export function HeroSection({
    loading: isLoading,
    movie,
    onOpenDetails: openDetails,
    onOpenWatch: openWatch,
}: {
    loading: boolean;
    movie: MovieDTO | null;
    onOpenDetails: (movie: MovieDTO) => void;
    onOpenWatch: (movie: MovieDTO) => void;
}) {
    if (isLoading) return <HeroSkeleton />;
    if (!movie) return null;
    return (
        <section className="relative w-full aspect-21/9 min-h-120 max-h-screen px-8 pt-6 z-10">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-white/5">
                <img src={movie.bannerUrl ?? ''} className="w-full h-full object-cover brightness-[0.65]" alt="Hero" />

                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-black/20 flex flex-col justify-end p-12">
                    <h1 className="text-6xl font-black mb-4 max-w-3xl font-poppins tracking-tighter text-text leading-[1.1]">
                        {movie.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {movie.rating && (
                            <span className="px-3 py-1.5 rounded-xl bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-yellow-500">
                                <Star size={12} fill="currentColor" /> {movie.rating}
                            </span>
                        )}
                        {movie.genres.map((genre) => (
                            <span
                                key={genre.id}
                                title={genre.id}
                                className="px-3 py-1.5 rounded-xl bg-secondary/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white"
                            >
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => openWatch(movie)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background px-8 py-3.5 rounded-3xl font-bold transition-all transform cursor-pointer shadow-lg shadow-primary/20"
                        >
                            <Play size={20} fill="currentColor" /> <span>Play Now</span>
                        </button>
                        <button
                            onClick={() => openDetails(movie)}
                            className="flex items-center gap-2 bg-secondary/20 backdrop-blur-xl border border-white/10 hover:bg-secondary/30 text-text px-8 py-3.5 rounded-3xl font-medium transition-all cursor-pointer"
                        >
                            <Info size={20} /> Details
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function MovieSkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            <div className="aspect-2/3 w-full bg-secondary/10 rounded-2xl border border-white/5" />
            <div className="space-y-2 px-1">
                <div className="h-4 w-3/4 bg-secondary/20 rounded-md" />
                <div className="h-3 w-1/2 bg-secondary/10 rounded-md" />
            </div>
        </div>
    );
}

export function HeroSkeleton() {
    return (
        <section className="relative w-full aspect-21/9 min-h-120 px-8 pt-6 z-10 animate-pulse">
            <div className="w-full h-full rounded-4xl bg-secondary/10 border border-white/5 flex flex-col justify-end p-12 space-y-6">
                <div className="h-14 w-1/2 bg-secondary/20 rounded-xl" />
                <div className="h-10 w-1/3 bg-secondary/10 rounded-xl" />
                <div className="flex gap-4">
                    <div className="h-12 w-40 bg-secondary/20 rounded-2xl" />
                    <div className="h-12 w-40 bg-secondary/10 rounded-2xl" />
                </div>
            </div>
        </section>
    );
}

function EmptyState({ canUpload, onNavigate }: { canUpload: boolean; onNavigate: () => void }) {
    return (
        <section className="px-8 py-12 relative z-10">
            <div className="flex flex-col items-center justify-center min-h-120 w-full bg-white/2 border border-dashed border-white/10 rounded-[40px] p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative mb-8">
                    <div className={`absolute inset-0 blur-2xl rounded-full ${canUpload ? 'bg-primary/20' : 'bg-red-500/10'}`} />

                    <div className="relative w-24 h-24 bg-secondary/20 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                        {canUpload ? (
                            <UploadCloud size={48} strokeWidth={1.5} className="text-primary" />
                        ) : (
                            <ShieldAlert size={48} strokeWidth={1.5} className="text-red-400" />
                        )}
                    </div>
                </div>

                <div className="max-w-md space-y-3">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        {canUpload ? 'Your library is empty' : 'Nothing to watch yet'}
                    </h3>
                    <p className="text-sm text-text/40 leading-relaxed px-4">
                        {canUpload
                            ? "It looks like you haven't uploaded any movies yet. Start building your collection today!"
                            : "The administrators haven't uploaded any content to the library. Please check back later."}
                    </p>
                </div>

                {canUpload ? (
                    <button
                        onClick={onNavigate}
                        className="mt-10 flex items-center gap-2 px-10 py-4 bg-primary text-background font-semibold rounded-2xl transition-all cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={3} />
                        UPLOAD
                    </button>
                ) : (
                    <div className="mt-10 px-6 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
                        Waiting for contributors
                    </div>
                )}
            </div>
        </section>
    );
}
