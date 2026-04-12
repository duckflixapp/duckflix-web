import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { formatTime } from '../../utils/format';
import type { WatchHistoryDTO } from '@duckflixapp/shared';

interface ResumeNotificationProps {
    watchProgress: WatchHistoryDTO;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onResume: (time: number) => unknown;
    onClose?: () => unknown;
}

export function ResumeNotification({ watchProgress, videoRef, onResume, onClose }: ResumeNotificationProps) {
    const [lastPosition] = useState(watchProgress.lastPosition);
    const [visible, setVisibility] = useState(!!lastPosition && lastPosition > 10);
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVideoReady = () => {
            if (lastPosition && lastPosition > 10) {
                setVideoLoaded(true);
            }
        };

        if (video.readyState >= 1) {
            handleVideoReady();
        }

        video.addEventListener('loadedmetadata', handleVideoReady);

        return () => {
            video.removeEventListener('loadedmetadata', handleVideoReady);
        };
    }, [videoRef, lastPosition]);

    useEffect(() => {
        if (!visible || !videoLoaded) return;

        const timer = setTimeout(() => setVisibility(false), 10000);
        return () => clearTimeout(timer);
    }, [videoLoaded, visible]);

    const handleResume = () => {
        onResume(lastPosition);
        handleClose();
    };

    const handleClose = () => {
        setVisibility(false);
        onClose?.();
    };

    return (
        <AnimatePresence>
            {visible && videoLoaded && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute bottom-32 left-8 z-70"
                >
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 min-w-75">
                        <div className="flex flex-col gap-1">
                            <span className="text-white text-[10px] uppercase font-black tracking-[0.2em]">Continue Watching?</span>
                            <span className="text-white/70 text-sm">
                                You stopped at <span className="text-primary/80">{formatTime(lastPosition)}</span>
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleResume}
                                className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play size={14} fill="currentColor" /> Resume
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                            >
                                <X size={14} /> Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
