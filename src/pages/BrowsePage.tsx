import type { MovieDTO } from '@duckflix/shared';
import { useMovies } from '../hooks/use-movies';
import { Play, Info, Star, UploadCloud, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from '../components/movies/MovieCard';

export default function BrowsePage() {
    const { data, isLoading, isError } = useMovies(1);
    const navigate = useNavigate();

    const openDetails = (movie: MovieDTO) => navigate(`/details/${movie.id}`);
    const openWatch = (movie: MovieDTO) => navigate(`/watch/${movie.id}`);

    if (isError) return <div className="p-10 text-center text-red-500">Error while loading</div>;

    const movies = isLoading ? Array(12).fill(null) : (data?.data as MovieDTO[]);
    const heroMovie: MovieDTO | null = movies.length > 0 ? movies[0] : null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative w-full h-full">
            <div
                className="absolute top-[10%] left-[30%] w-125 h-125 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"
                style={{ animationDuration: '8s' }}
            />
            <HeroSection loading={isLoading} movie={heroMovie} onOpenDetails={openDetails} onOpenWatch={openWatch} />
            {movies.length === 0 && (
                <section className="px-8 py-12 relative z-10">
                    <div className="flex flex-col items-center justify-center min-h-100 w-full bg-white/2 border border-dashed border-white/10 rounded-[40px] p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
                            <div className="relative w-20 h-20 bg-secondary/20 border border-white/10 rounded-3xl flex items-center justify-center text-primary shadow-2xl">
                                <UploadCloud size={40} strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Tekstualni deo */}
                        <div className="max-w-sm space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-tight">Your library is empty</h3>
                            <p className="text-sm text-text/40 leading-relaxed">
                                It looks like you haven't uploaded any movies yet. Start building your collection today!
                            </p>
                        </div>

                        {/* Akciono dugme */}
                        <button
                            onClick={() => navigate('/upload')}
                            className="mt-8 flex items-center gap-3 px-8 py-3.5 bg-primary text-background font-bold rounded-2xl transition-all hover:bg-primary/90 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            <Plus size={20} strokeWidth={3} />
                            START UPLOADING
                        </button>
                    </div>
                </section>
            )}
            {movies.length > 0 && (
                <section className="px-8 py-12 relative z-10">
                    <div className="flex flex-col gap-1 mb-8">
                        <h2 className="text-2xl font-bold font-poppins tracking-tight text-text">Recently Added</h2>
                        <div className="h-1 w-12 bg-primary rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        <MovieListSection loading={isLoading} movies={movies} onOpenDetails={openDetails} />
                    </div>
                </section>
            )}
        </div>
    );
}

function MovieListSection({
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

    return movies.map((movie) => <MovieCard movie={movie} key={movie.id} onClick={() => openDetails(movie)} />);
}

function HeroSection({
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
        <section className="relative w-full aspect-21/9 min-h-120 px-8 pt-6 z-10">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-white/5">
                <img src={movie.bannerUrl ?? ''} className="w-full h-full object-cover brightness-[0.65]" alt="Hero" />

                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-black/20 flex flex-col justify-end p-12">
                    <h1 className="text-6xl font-black mb-4 max-w-3xl font-poppins tracking-tighter text-text leading-[1.1]">
                        {movie.title}
                    </h1>
                    <div className="flex gap-2 mb-6">
                        {movie.rating && (
                            <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-yellow-500">
                                <Star size={12} fill="currentColor" /> {movie.rating}
                            </span>
                        )}
                        {movie.genres.map((genre) => (
                            <span
                                key={genre.id}
                                title={genre.id}
                                className="px-3 py-1.5 rounded-lg bg-secondary/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white"
                            >
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => openWatch(movie)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background px-8 py-3.5 rounded-2xl font-bold transition-all transform cursor-pointer shadow-lg shadow-primary/20"
                        >
                            <Play size={20} fill="currentColor" /> Play Now
                        </button>
                        <button
                            onClick={() => openDetails(movie)}
                            className="flex items-center gap-2 bg-secondary/20 backdrop-blur-xl border border-white/10 hover:bg-secondary/30 text-text px-8 py-3.5 rounded-2xl font-medium transition-all cursor-pointer"
                        >
                            <Info size={20} /> Details
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MovieSkeleton() {
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

function HeroSkeleton() {
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
