import type { ContentDTO } from '@duckflixapp/shared';
import { useState } from 'react';

export function ContentCard({ content, onClick: handleClick }: { content: ContentDTO; onClick?: () => unknown }) {
    const [imgError, setImgError] = useState(false);
    const showPlaceholder = !content.image || imgError;

    return (
        <button
            type="button"
            disabled={!handleClick}
            aria-label={`Open ${content.title}${content.release ? ` (${content.release})` : ''}`}
            className="group/movie-card relative w-full text-left transition-all duration-300 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-default"
            onClick={() => handleClick?.()}
        >
            <div
                className="relative aspect-2/3 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 border border-white/5 transition-all duration-500 
            shadow-[0_8px_30px_rgb(255,255,255,0.04)] group-hover/movie-card:border-primary/50 group-hover/movie-card:shadow-primary/20 group-hover/movie-card:shadow-2xl"
            >
                {!showPlaceholder ? (
                    <img
                        src={content.image!}
                        alt={content.title}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover transition-transform duration-700 sm:group-hover/movie-card:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-white/10 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">No Poster</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 sm:group-hover/movie-card:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="px-1">
                <h3 className="font-bold text-[12px] sm:text-sm truncate text-text/90 group-hover/movie-card:text-primary transition-colors duration-300">
                    {content.title}
                </h3>
                {content.release && (
                    <p className="text-[9px] sm:text-[10px] font-black text-text/30 uppercase tracking-widest mt-0.5">{content.release}</p>
                )}
            </div>
        </button>
    );
}

export function CardSkeleton() {
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
