import type { CastMemberDTO } from '@duckflixapp/shared';
import { ExternalLink } from 'lucide-react';
import { useRef } from 'react';

export function DetailsCast({ cast, limit = 10 }: { cast: CastMemberDTO[]; limit?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const hasDragged = useRef(false);

    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        hasDragged.current = false;
        startX.current = e.pageX - ref.current!.offsetLeft;
        scrollLeft.current = ref.current!.scrollLeft;
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        hasDragged.current = true;
        const x = e.pageX - ref.current!.offsetLeft;
        ref.current!.scrollLeft = scrollLeft.current - (x - startX.current);
    };

    const stopDrag = () => {
        isDragging.current = false;
    };

    if (!cast.length) return null;

    return (
        <div>
            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Cast</h3>
            <div
                ref={ref}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={stopDrag}
                onMouseLeave={stopDrag}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 cursor-grab active:cursor-grabbing select-none"
            >
                {cast.slice(0, limit).map((member) => (
                    <CastMember key={member.id} member={member} hasDragged={hasDragged} />
                ))}
            </div>
        </div>
    );
}

function CastMember({ member, hasDragged }: { member: CastMemberDTO; hasDragged: React.RefObject<boolean> }) {
    const initials = member.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('');

    return (
        <div className="group shrink-0 w-28 flex flex-col items-center gap-2.5">
            <div className="relative w-18 h-18 rounded-full overflow-clip ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-300 bg-white/5">
                {member.profileUrl ? (
                    <img
                        src={member.profileUrl}
                        loading="lazy"
                        alt={member.name + ' profile picture'}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-white/40">{initials}</div>
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 rounded-full" />
                {member.tmdbUrl && (
                    <a
                        href={member.tmdbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            if (hasDragged.current) e.preventDefault();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                    >
                        <ExternalLink size={16} className="text-white" />
                    </a>
                )}
            </div>

            <div className="text-center w-full space-y-0.5">
                <p className="text-sm font-medium text-white/90 leading-tight truncate" title={member.name}>
                    {member.name}
                </p>
                {member.character && (
                    <p className="text-xs text-white/35 leading-tight truncate" title={member.character}>
                        {member.character}
                    </p>
                )}
            </div>
        </div>
    );
}
