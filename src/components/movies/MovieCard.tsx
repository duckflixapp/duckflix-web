import type { MovieDTO } from '@duckflix/shared';

export function MovieCard({ movie, onClick: handleClick }: { movie: MovieDTO; onClick?: () => unknown }) {
    return (
        <div className="group cursor-pointer" onClick={handleClick}>
            <div className="relative aspect-2/3 rounded-2xl overflow-hidden mb-4 border border-white/5 shadow-xl transition-all duration-500 group-hover:border-primary/50 group-hover:-translate-y-2">
                <img src={movie.posterUrl ?? ''} alt={movie.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-sm truncate text-text/90 group-hover:text-primary transition-colors">{movie.title}</h3>
        </div>
    );
}

export function MovieCardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="aspect-2/3 w-full bg-white/5 rounded-2xl mb-4 border border-white/5" />
            <div className="h-4 w-3/4 bg-white/10 rounded-md" />
        </div>
    );
}
