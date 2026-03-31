import { Loader2, Layers, HardDrive, FileVideo } from 'lucide-react';
import type { VideoVersionDTO } from '@duckflix/shared';
import { formatBytes } from '../../utils/format';

export function VideoProcessing({ title, originalVersion }: { title: string; originalVersion: VideoVersionDTO | null }) {
    return (
        <div className="relative h-full flex flex-col items-center justify-center bg-transparent text-text overflow-hidden">
            <div className="absolute top-[40%] -right-[10%] transition-all duration-300 sm:w-75 sm:h-75 md:w-100 md:h-100 lg:w-150 lg:h-150 bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col items-center space-y-4 max-w-2xl px-12 text-center">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 size={40} className="text-primary animate-spin stroke-[1.5]" />
                        </div>

                        <h1 className="text-4xl md:text-4xl font-black tracking-tight text-white/90">Processing...</h1>
                    </div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.5em] font-black mx-auto max-w-xs leading-loose">
                        {title}
                    </p>
                </div>

                <div className="flex items-center gap-6 pt-8">
                    {originalVersion?.fileSize && (
                        <div className="flex items-center gap-2 text-white/20">
                            <HardDrive size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{formatBytes(originalVersion.fileSize)}</span>
                        </div>
                    )}
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2 text-white/20">
                        <Layers size={14} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Transcoding</span>
                    </div>
                    {originalVersion?.mimeType && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-2 text-white/20">
                                <FileVideo size={14} />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                    {originalVersion.mimeType.split('/')[1].toUpperCase()}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
