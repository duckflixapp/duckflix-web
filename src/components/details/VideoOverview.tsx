import { useState } from 'react';

export default function VideoOverview({ overview, title }: { overview: string | null; title: string | null }) {
    const [expanded, setExpanded] = useState(false);
    if (!overview) return null;

    const handleClick = () => setExpanded((prev) => !prev);

    return (
        <div>
            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">{title ?? 'Overview'}</h3>
            <div className="flex flex-wrap gap-3">
                <p
                    onClick={handleClick}
                    className={`text-text/70 w-full text-sm leading-relaxed cursor-pointer ${!expanded && 'line-clamp-3'}`}
                >
                    {overview}
                </p>
            </div>
        </div>
    );
}
