import type { MovieMinDTO } from '@duckflix/shared';

export function MovieCard({ movie, onClick: handleClick }: { movie: MovieMinDTO; onClick?: () => unknown }) {
    return (
        <div className="group cursor-pointer relative z-10 hover:z-50 transition-all duration-300" onClick={handleClick}>
            <div className="relative aspect-2/3 rounded-2xl overflow-hidden mb-3 border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-primary/20 group-hover:shadow-2xl">
                {movie.posterUrl ? (
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-white/10 font-black uppercase tracking-widest text-[10px]">No Poster</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="px-1">
                <h3 className="font-bold text-sm truncate text-text/90 group-hover:text-primary transition-colors duration-300">
                    {movie.title}
                </h3>
                {movie.releaseYear && (
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest mt-0.5">{movie.releaseYear}</p>
                )}
            </div>
        </div>
    );
}

export function MovieCardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="aspect-2/3 w-full bg-white/5 rounded-2xl mb-3 border border-white/5 shadow-lg" />
            <div className="space-y-2 px-1">
                <div className="h-3 w-3/4 bg-white/10 rounded-full" />
                <div className="h-2 w-1/4 bg-white/5 rounded-full" />
            </div>
        </div>
    );
}
