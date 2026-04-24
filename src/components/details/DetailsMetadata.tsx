import { Calendar, Clock, Star } from 'lucide-react';

export function DetailsMetadata({
    rating = null,
    tag = null,
    release = null,
    runtime = null,
    chip: version = null,
    tmdbUrl = null,
}: {
    rating?: string | null;
    tag?: string | null;
    release?: string | null;
    runtime?: number | null;
    tmdbUrl?: string | null;
    chip?: string | null;
}) {
    return (
        <div className="flex flex-wrap text-shadow-2xs text-shadow-black items-center gap-4 text-sm font-medium">
            {tag && (
                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-sm font-bold uppercase tracking-widest">
                    {tag}
                </span>
            )}
            {rating && (
                <div className="flex items-center gap-1.5 text-yellow-500  bg-yellow-500/10 px-3 py-1 rounded-2xl border border-yellow-500/20">
                    <Star size={15} fill="currentColor" />
                    <span>{rating}</span>
                </div>
            )}
            {release && (
                <div className="flex items-center gap-1.5 text-text/60">
                    <Calendar size={16} />
                    <span>{release}</span>
                </div>
            )}
            {runtime && (
                <div className="flex items-center gap-1.5 text-text/60">
                    <Clock size={16} />
                    <span>{runtime}m</span>
                </div>
            )}
            {tmdbUrl && (
                <a
                    href={tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text/60 hover:text-white transition-colors"
                >
                    <img src="https://www.themoviedb.org/favicon.ico" className="w-4 h-4 rounded-sm" />
                    <span>TMDb</span>
                </a>
            )}
            {version && (
                <span className="px-2 py-0.5 border border-white/20 rounded-xl text-[10px] uppercase text-white/40">{version}</span>
            )}
        </div>
    );
}
