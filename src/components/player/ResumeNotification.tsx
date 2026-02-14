import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Ako koristiš framer-motion za animacije
import { Play, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/format';

interface ResumeNotificationProps {
    movieId: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onClose?: () => void;
}

export function ResumeNotification({ movieId, videoRef, onClose }: ResumeNotificationProps) {
    const [resumeTime, setResumeTime] = useState<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const checkProgress = () => {
            const savedTime = localStorage.getItem(`watch-progress-${movieId}`);
            const time = savedTime ? parseFloat(savedTime) : 0;

            if (time > 10 && time < video.duration - 30) setResumeTime(time);
        };

        video.addEventListener('loadedmetadata', checkProgress);
        return () => video.removeEventListener('loadedmetadata', checkProgress);
    }, [movieId, videoRef]);

    useEffect(() => {
        if (resumeTime) {
            const timer = setTimeout(() => setResumeTime(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [resumeTime]);

    if (!resumeTime) return null;

    const handleResume = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = resumeTime;
            videoRef.current.play();
        }
        setResumeTime(null);
        onClose?.();
    };

    const handleStartOver = () => {
        localStorage.removeItem(`watch-progress-${movieId}`);
        setResumeTime(null);
        onClose?.();
    };

    return (
        <AnimatePresence>
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
                            You stopped at <span className="text-primary/80">{formatTime(resumeTime)}</span>
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
                            onClick={handleStartOver}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                        >
                            <RotateCcw size={14} /> Start Over
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
