import type { MovieDTO } from '@duckflix/shared';
import { useMovies } from '../hooks/use-movies';
import { Play, Info, Star } from 'lucide-react';

export default function BrowsePage() {
    const { data, isLoading, isError } = useMovies(1);

    if (isError) return <div className="p-10 text-center text-red-500">Error while loading</div>;

    const movies = isLoading ? Array(12).fill(null) : (data?.data as MovieDTO[]);
    const heroMovie: MovieDTO = movies[0];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div
                className="absolute top-[10%] left-[30%] w-125 h-125 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"
                style={{ animationDuration: '8s' }}
            />

            <HeroSection loading={isLoading} movie={heroMovie} />
            <section className="px-8 py-12 relative z-10">
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-2xl font-bold font-poppins tracking-tight text-text">Recently Added</h2>
                    <div className="h-1 w-12 bg-primary rounded-full" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    <MovieListSection loading={isLoading} movies={movies} />
                </div>
            </section>
        </div>
    );
}

function MovieListSection({ loading: isLoading, movies }: { loading: boolean; movies: MovieDTO[] }) {
    if (isLoading)
        return Array(12)
            .fill(0)
            .map((_, i) => <MovieSkeleton key={i} />);

    return movies.map((movie) => (
        <div key={movie.id} className="group cursor-pointer">
            <div className="relative aspect-2/3 rounded-2xl overflow-hidden mb-4 border border-white/5 shadow-xl transition-all duration-500 group-hover:border-primary/50 group-hover:-translate-y-2">
                <img src={movie.posterUrl ?? ''} alt={movie.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-sm truncate text-text/90 group-hover:text-primary transition-colors">{movie.title}</h3>
        </div>
    ));
}

function HeroSection({ loading: isLoading, movie }: { loading: boolean; movie: MovieDTO }) {
    if (isLoading) return <HeroSkeleton />;
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
                            <span className="px-3 py-1.5 rounded-lg bg-secondary/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-primary">
                                <Star size={12} fill="currentColor" /> {movie.rating}
                            </span>
                        )}
                        {movie.genres.map((genre) => (
                            <span
                                title={genre.id}
                                className="px-3 py-1.5 rounded-lg bg-secondary/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white"
                            >
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background px-8 py-3.5 rounded-2xl font-bold transition-all transform cursor-pointer hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-primary/20">
                            <Play size={20} fill="currentColor" /> Play Now
                        </button>
                        <button className="flex items-center gap-2 bg-secondary/20 backdrop-blur-xl border border-white/10 hover:bg-secondary/30 text-text px-8 py-3.5 rounded-2xl font-bold transition-all cursor-pointer">
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
                <div className="flex gap-2">
                    <div className="h-6 w-20 bg-secondary/20 rounded-lg" />
                    <div className="h-6 w-16 bg-secondary/20 rounded-lg" />
                </div>
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
