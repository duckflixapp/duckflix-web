import type { CastMemberDTO } from '@duckflixapp/shared';
import { ExternalLink } from 'lucide-react';

export function DetailsCast({ cast, limit = 10 }: { cast: CastMemberDTO[]; limit?: number }) {
    if (!cast.length) return null;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Cast</h3>
                {/* <a href="" className="text-sm text-white/30 font-medium mb-4">
                    View All
                </a> */}
            </div>
            <div className="grid h-29 grid-cols-[repeat(auto-fill,7rem)] grid-rows-[7.375rem] auto-rows-[7.375rem] gap-x-3 gap-y-0 overflow-hidden -mx-1 px-1">
                {cast.slice(0, limit).map((member) => (
                    <CastMember key={member.id} member={member} />
                ))}
            </div>
        </div>
    );
}

function CastMember({ member }: { member: CastMemberDTO }) {
    const initials = member.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('');

    return (
        <div className="group shrink-0 w-28 flex flex-col items-center gap-2.5">
            <div className="relative w-18 h-18 top-1 rounded-full overflow-clip ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-300 bg-white/5">
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
