import { useRef, useEffect, memo } from 'react';

interface ProgressBarProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isScrubbing: boolean;
    onScrubStart: (e: React.MouseEvent) => void;
    onScrubEnd: () => void;
}

export const ProgressBar = memo(function ProgressBar({ videoRef, isScrubbing, onScrubStart, onScrubEnd }: ProgressBarProps) {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const bufferBarRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const update = () => {
            const video = videoRef.current;

            if (video) {
                if (progressBarRef.current && !isScrubbing) {
                    const progress = (video.currentTime / video.duration) * 100 || 0;
                    progressBarRef.current.style.width = `${progress}%`;
                }

                if (bufferBarRef.current && video.buffered.length > 0) {
                    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                    const bufferPercent = (bufferedEnd / video.duration) * 100 || 0;
                    bufferBarRef.current.style.width = `${bufferPercent}%`;
                }
            }

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [videoRef, isScrubbing]);

    return (
        <div
            onMouseDown={onScrubStart}
            onMouseUp={onScrubEnd}
            className="w-full h-1.5 hover:h-2 bg-white/10 rounded-full mb-6 relative group/progress cursor-pointer transition-all"
        >
            <div
                ref={bufferBarRef}
                className="absolute h-full bg-white/20 rounded-full transition-all duration-300 ease-out"
                style={{ width: '0%' }}
            />
            <div
                ref={progressBarRef}
                className="absolute h-full bg-primary rounded-full"
                style={{ width: '0%', transition: isScrubbing ? 'none' : 'width 0.1s linear' }}
            />
        </div>
    );
});
