import { Play, Loader2 } from 'lucide-react';

export function PlayerOverlay({ paused, isBuffering }: { paused: boolean; isBuffering: boolean }) {
    return (
        <>
            {paused && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                    <div className="p-8 bg-black/40 rounded-full backdrop-blur-lg border border-white/10 text-white animate-in zoom-in duration-200">
                        <Play size={48} fill="currentColor" />
                    </div>
                </div>
            )}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/10 backdrop-blur-xs">
                    <Loader2 size={64} className="text-primary animate-spin" />
                </div>
            )}
        </>
    );
}
