import { Loader2, Users, Antenna } from 'lucide-react';
import type { DownloadProgress } from '@duckflix/shared';

export function MovieDownloadProgress({ title, progress }: { title: string; progress: DownloadProgress | null }) {
    const percent = progress?.percent ?? 0;

    return (
        <div className="relative h-full flex flex-col items-center justify-center text-text overflow-hidden">
            <div className="absolute top-[40%] -right-[10%] transition-all duration-300 sm:w-75 sm:h-75 md:w-100 md:h-100 lg:w-150 lg:h-150 bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-2xl px-12 space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white/90">{title}</h1>
                    <div className="flex items-center justify-center gap-3 text-white/30">
                        <Loader2 size={14} className="animate-spin text-primary/60" />
                        <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Downloading metadata & content</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-end justify-between px-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{Math.floor(percent)}</span>
                            <span className="text-xl font-bold text-primary/80">.{(percent % 1).toFixed(2).split('.')[1]}%</span>
                        </div>

                        <div className="flex gap-6 mb-1">
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-wider text-white/20 font-bold">Speed</p>
                                <p className="text-sm font-bold text-white/70 tabular-nums">{progress?.speed ?? '0 KB/s'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-wider text-white/20 font-bold">ETA</p>
                                <p className="text-sm font-bold text-white/70 tabular-nums">{progress?.eta ?? '--:--'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-white/30">
                            <Users size={12} className="text-white/20" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{progress?.peers.active ?? 0} Peers</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2 text-white/30">
                            <Antenna size={12} className="text-white/20" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {progress?.peers.connecting ?? 0} Connecting
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
