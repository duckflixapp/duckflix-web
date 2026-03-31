import type { MovieDTO, VideoType } from '@duckflix/shared';
import { useBestRatedMovies, useInfiniteMovies, useRecentMovies } from '../hooks/useMovies';
import { Info, Star, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from '../components/movies/MovieCard';
import { useAuthContext } from '../contexts/AuthContext';
import { useInView } from 'react-intersection-observer';
import { useEffect, useRef } from 'react';
import { useFeaturedMovie } from '../hooks/useMovieDetailed';
import PlayButton from '../components/buttons/PlayButton';

const SHOW_BEST_RATED_THRESHOLD = 7;

export default function BrowsePage() {
    const { movie: heroMovie } = useFeaturedMovie();
    const { data: recentMovies, isLoading: recentLoading } = useRecentMovies({ page: 1, limit: 12 });
    const { data: bestRatedMovies, isLoading: bestRatedLoading } = useBestRatedMovies({ page: 1, limit: 12 });
    const {
        data: infiniteData,
        isLoading: allLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteMovies({ limit: 20, orderBy: 'title' });
    const auth = useAuthContext();
    const navigate = useNavigate();

    const { ref, inView } = useInView();

    const openDetails = (type: VideoType, id: string) => navigate(`/details/${type}/${id}`);

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, hasNextPage]);

    const moviesLoading = allLoading || recentLoading || bestRatedLoading;
    const allMovies = infiniteData?.pages.flatMap((page) => page.data) ?? [];
    const hasMovies = allMovies.length > 0;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative w-full h-full">
            <div
                className="absolute top-[10%] left-[30%] w-125 h-125 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"
                style={{ animationDuration: '8s' }}
            />
            {!hasMovies && !moviesLoading && (
                <EmptyState canUpload={auth?.hasRole('contributor') ?? false} onNavigate={() => navigate('/upload')} />
            )}
            <HeroSection loading={recentLoading} movie={heroMovie} onOpenDetails={openDetails} />
            {hasMovies && (
                <div className="flex flex-col px-8 py-12 gap-8">
                    {recentMovies && recentMovies.length > 0 && (
                        <MovieListSection
                            title="Recently Added"
                            movies={recentMovies}
                            loading={recentLoading}
                            onOpenDetails={openDetails}
                        />
                    )}
                    {(bestRatedLoading || (bestRatedMovies && bestRatedMovies.length >= SHOW_BEST_RATED_THRESHOLD)) && (
                        <MovieListSection
                            title="Best Rated"
                            movies={bestRatedMovies}
                            loading={bestRatedLoading}
                            onOpenDetails={openDetails}
                        />
                    )}
                    <section className="relative z-10">
                        <div className="flex flex-col gap-1 mb-8">
                            <h2 className="text-xl md:text-2xl font-bold font-poppins tracking-tight text-text">Library (A-Z)</h2>
                            <div className="h-1 w-12 bg-primary rounded-full" />
                        </div>

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                            {allMovies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} onClick={() => openDetails('movie', movie.id)} />
                            ))}

                            {isFetchingNextPage &&
                                Array(6)
                                    .fill(0)
                                    .map((_, i) => <MovieSkeleton key={i} />)}
                        </div>

                        <div ref={ref} className="h-20 w-full" />
                    </section>
                </div>
            )}
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
    onOpenDetails: (type: VideoType, id: string) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;

            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="relative z-10">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-xl md:text-2xl font-bold font-poppins tracking-tight text-text">{title}</h2>
                <div className="h-1 w-12 bg-primary rounded-full" />
            </div>

            <div className="relative group/movie-section">
                <button
                    onClick={() => scroll('left')}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 p-2 bg-secondary/20 backdrop-blur-xl border border-white/10 rounded-full text-white opacity-0 group-hover/movie-section:opacity-100 transition-all cursor-pointer hidden md:block hover:bg-secondary/30"
                >
                    <ChevronLeft size={24} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 custom-scrollbar snap-x snap-mandatory scroll-smooth"
                >
                    <MovieList loading={isLoading} movies={movies} onOpenDetails={openDetails} />
                </div>
                <button
                    onClick={() => scroll('right')}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 p-2 bg-secondary/20 backdrop-blur-xl border border-white/10 rounded-full text-white opacity-0 group-hover/movie-section:opacity-100 transition-all cursor-pointer hidden md:block hover:bg-secondary/30"
                >
                    <ChevronRight size={24} />
                </button>

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
    onOpenDetails: (type: VideoType, id: string) => void;
}) {
    if (isLoading)
        return Array(12)
            .fill(0)
            .map((_, i) => <MovieSkeleton key={i} />);

    return movies.map((movie) => (
        <div key={movie.id} className="flex-none w-40 md:w-48 snap-start transition-all py-4">
            <MovieCard movie={movie} onClick={() => openDetails('movie', movie.id)} />
        </div>
    ));
}

export function HeroSection({
    loading: isLoading,
    movie,
    onOpenDetails: openDetails,
}: {
    loading: boolean;
    movie: MovieDTO | null;
    onOpenDetails: (type: VideoType, id: string) => void;
}) {
    if (isLoading) return <HeroSkeleton />;
    if (!movie) return null;
    const canPlay = movie.duration && movie.video.status == 'ready';
    return (
        <section className="relative w-full aspect-21/9 min-h-120 max-h-screen px-8 pt-6 z-10">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-white/5">
                <img src={movie.bannerUrl ?? ''} className="w-full h-full object-cover brightness-[0.65]" alt="Hero Banner" />

                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-black/20 flex flex-col justify-end p-12">
                    <h1 className="text-6xl font-black mb-4 max-w-3xl font-poppins tracking-tighter text-text leading-[1.1]">
                        {movie.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {movie.rating && (
                            <span className="px-3 py-1.5 rounded-2xl bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-yellow-500">
                                <Star size={12} fill="currentColor" /> {movie.rating}
                            </span>
                        )}
                        {movie.genres.map((genre) => (
                            <span
                                key={genre.id}
                                title={genre.id}
                                className="px-3 py-1.5 rounded-2xl bg-secondary/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white"
                            >
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {canPlay && <PlayButton videoId={movie.videoId} />}
                        <button
                            onClick={() => openDetails('movie', movie.id)}
                            className="flex items-center gap-2 bg-secondary/20 backdrop-blur-xl border border-white/10 hover:bg-secondary/30 text-text px-8 py-3.5 rounded-4xl font-medium transition-all cursor-pointer"
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
                        className="mt-10 flex items-center gap-2 px-8 py-3.5 bg-primary text-background font-semibold rounded-4xl transition-all cursor-pointer shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Upload
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
