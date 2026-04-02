import type { ContentDTO } from '@duckflix/shared';
import { useState } from 'react';

export function ContentCard({ content, onClick: handleClick }: { content: ContentDTO; onClick?: () => unknown }) {
    const [imgError, setImgError] = useState(false);

    const showPlaceholder = !content.image || imgError;

    return (
        <div className="group/movie-card cursor-pointer relative transition-all duration-300" onClick={handleClick}>
            <div
                className="relative aspect-2/3 rounded-2xl overflow-hidden mb-3 border border-white/5  transition-all duration-500 
            shadow-[0_8px_30px_rgb(255,255,255,0.04)] group-hover/movie-card:border-primary/50 group-hover/movie-card:shadow-primary/20 group-hover/movie-card:shadow-2xl
            "
            >
                {!showPlaceholder ? (
                    <img
                        src={content.image!}
                        alt={content.title}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/movie-card:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-white/10 font-black uppercase tracking-widest text-[10px]">No Poster</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/movie-card:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="px-1">
                <h3 className="font-bold text-sm truncate text-text/90 group-hover/movie-card:text-primary transition-colors duration-300">
                    {content.title}
                </h3>
                {content.release && (
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest mt-0.5">{content.release}</p>
                )}
            </div>
        </div>
    );
}
