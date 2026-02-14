import { useState, useRef, useEffect, useCallback, type ButtonHTMLAttributes } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Play,
    Pause,
    Maximize,
    Minimize,
    Settings,
    Subtitles,
    Cast,
    Volume2,
    VolumeOff,
    Volume1,
    Volume,
    Loader2,
} from 'lucide-react';
import { useMovieDetail } from '../hooks/use-movie-detailed';
import { getQualityLabel } from '../utils/format';
import { SettingsBox } from '../components/player/WatchSettings';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { PlayerOverlay } from '../components/player/PlayerOverlay';
import { ProgressBar } from '../components/player/ProgressBar';
import { playerShortcuts } from '../config/player';
import { ResumeNotification } from '../components/player/ResumeNotification';

const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function WatchPage() {
    const { id } = useParams<{ id: string }>();
    const { data: movie, isLoading } = useMovieDetail(id);
    const navigate = useNavigate();

    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSubtitlesOpen, setIsSubtitlesOpen] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const timeDisplayRef = useRef<HTMLSpanElement>(null);

    const lastActionTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const [manualRes, setManualRes] = useState<number | null>(null);
    const availableVersions = movie?.versions.filter((v) => v.status === 'ready').sort((a, b) => b.height - a.height) || [];
    const activeVersion = manualRes ? availableVersions.find((v) => v.height === manualRes) : availableVersions[0];

    const actionCallback = () => {
        lastActionTimeRef.current = Date.now();
        setShowControls(true);
    };

    const player = useVideoPlayer(actionCallback);
    const { videoRef } = player;

    // progress memory
    const saveProgress = useCallback(() => {
        console.log('called');
        const video = videoRef.current;
        if (!video) return;

        if (!video.paused && video.currentTime > 10 && video.currentTime < video.duration - 10)
            localStorage.setItem(`watch-progress-${id}`, video.currentTime.toString());

        if (video.currentTime > video.duration - 10) localStorage.removeItem(`watch-progress-${id}`);
    }, [id, videoRef]);

    // UI Effects
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let updates = 0;
        const updateTime = () => {
            if (timeDisplayRef.current) {
                const current = formatTime(video.currentTime);
                const total = formatTime(video.duration || 0);
                timeDisplayRef.current.innerText = `${current} / ${total}`;
                updates++;
            }
            if (updates > 10) {
                updates = 0;
                saveProgress();
            }
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateTime);

        updateTime();
        saveProgress();
        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateTime);
            saveProgress();
        };
    }, [videoRef, activeVersion, saveProgress]);

    // Autohide controls
    const registerAction = useCallback(() => {
        lastActionTimeRef.current = Date.now();
        if (!showControls) setShowControls(true);
    }, [showControls]);

    // watchdog for controlls
    useEffect(() => {
        const interval = setInterval(() => {
            if (showControls && Date.now() - lastActionTimeRef.current > 3000 && !player.paused && !isSettingsOpen) {
                setShowControls(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [player.paused, isSettingsOpen, showControls]);

    // Scrubbing Logic
    const handleSeek = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!videoRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = e.clientX;
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            videoRef.current.currentTime = pos * videoRef.current.duration;
        },
        [videoRef]
    );

    useEffect(() => {
        if (!isScrubbing) return;
        const onMove = (e: MouseEvent) => handleSeek(e);
        const onUp = () => setIsScrubbing(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isScrubbing, handleSeek]);

    const toggleSettings = () => {
        setIsSubtitlesOpen(false);
        setIsSettingsOpen((p) => !p);
    };

    const toggleSubtitles = () => {
        setIsSettingsOpen(false);
        setIsSubtitlesOpen((p) => !p);
    };

    const closeMenus = () => {
        setIsSubtitlesOpen(false);
        setIsSettingsOpen(false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            playerShortcuts.forEach((shortcut) => {
                if (!shortcut.keys.includes(e.key.toLowerCase())) return;

                if (shortcut.func === 'closeOpenMenu') {
                    if (isSettingsOpen) setIsSettingsOpen(false);
                    else if (isSubtitlesOpen) setIsSubtitlesOpen(false);
                    else if (showControls) setShowControls(false);
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSettingsOpen, isSubtitlesOpen, showControls]);

    if (isLoading || !movie)
        return (
            <div className="h-screen bg-black flex items-center justify-center text-primary">
                <Loader2 className="animate-spin" />
            </div>
        );

    // Helper icons
    const PlayIcon = player.paused ? Play : Pause;
    const FullScrnIcon = player.fullScreen ? Minimize : Maximize;
    const VolumeIcon = player.muted ? VolumeOff : player.volume === 0 ? Volume : player.volume < 5 ? Volume1 : Volume2;

    return (
        <div
            ref={containerRef}
            className={`h-screen w-screen bg-black relative group overflow-hidden ${showControls ? 'cursor-default' : 'cursor-none'}`}
            onMouseMove={registerAction}
            onClick={registerAction}
        >
            <video
                ref={videoRef}
                src={activeVersion?.streamUrl}
                className="w-full h-full max-h-screen object-contain"
                onClick={player.togglePlay}
                onWaiting={() => player.setIsBuffering(true)}
                onPlaying={() => player.setIsBuffering(false)}
                onCanPlay={() => player.setIsBuffering(false)}
                onEnded={() => player.setPaused(true)}
                onPause={() => player.setPaused(true)} // e.g. os can pause player
                onPlay={() => player.setPaused(false)}
            />

            {/* TOP BAR */}
            <div
                className={`absolute top-0 left-0 w-full p-8 bg-linear-to-b from-black/80 to-transparent transition-opacity duration-300 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
                            <ChevronLeft size={24} className="text-white" />
                        </button>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-none">{movie.title}</h1>
                            {activeVersion && (
                                <p className="text-white/40 text-xs font-bold uppercase mt-1">
                                    {getQualityLabel(activeVersion.width || 0, activeVersion.height)}
                                </p>
                            )}
                        </div>
                    </div>
                    {player.isCastAvailable && <Cast className="text-white/70 hover:text-white cursor-pointer" />}
                </div>
            </div>

            <PlayerOverlay paused={player.paused} isBuffering={player.isBuffering} />

            {id && <ResumeNotification movieId={id} videoRef={videoRef} />}

            {/* BOTTOM CONTROLS */}
            <div
                className={`absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-black/90 to-transparent transition-opacity duration-300 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <ProgressBar
                    videoRef={videoRef}
                    isScrubbing={isScrubbing}
                    onScrubStart={(e) => {
                        setIsScrubbing(true);
                        handleSeek(e);
                    }}
                    onScrubEnd={() => setIsScrubbing(false)}
                />

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-6">
                        <button onClick={player.togglePlay} className="text-white transition-colors cursor-pointer">
                            <PlayIcon size={28} fill="currentColor" />
                        </button>

                        <div className="flex items-center gap-3 group/vol">
                            <button onClick={player.toggleMute} className="text-white/70 hover:text-white">
                                <VolumeIcon size={20} />
                            </button>
                            <div className="flex items-center w-0 overflow-x-clip group-hover/vol:w-24 transition-all duration-300">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={player.volume}
                                    onChange={(e) => player.setVolume(Number(e.target.value))}
                                    className="h-1 w-20 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>

                        <span ref={timeDisplayRef} className="text-xs font-mono text-white/60">
                            00:00 / 00:00
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Button onClick={toggleSubtitles} active={isSubtitlesOpen}>
                                <Subtitles size={21} />
                            </Button>
                        </div>

                        <div className="relative">
                            <Button onClick={toggleSettings} active={isSettingsOpen}>
                                <Settings size={21} className={`transition-all ${isSettingsOpen && 'rotate-90'}`} />
                            </Button>
                            <SettingsBox
                                isOpen={isSettingsOpen}
                                onClose={() => setIsSettingsOpen(false)}
                                versions={availableVersions}
                                activeVersion={activeVersion ?? null}
                                onChangeResolution={(v) => {
                                    const t = videoRef.current?.currentTime || 0;
                                    setManualRes(v.height);
                                    setIsSettingsOpen(false);
                                    setTimeout(() => {
                                        if (videoRef.current) videoRef.current.currentTime = t;
                                    }, 100);
                                }}
                                playbackSpeed={player.playbackSpeed}
                                onChangeSpeed={player.setPlaybackSpeed}
                            />
                        </div>

                        <div>
                            <Button
                                onClick={() => {
                                    closeMenus();
                                    player.toggleFullScreen();
                                }}
                            >
                                <FullScrnIcon size={21} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Button({ active, children, ...rest }: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={`p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer ${active ? 'text-primary bg-white/10' : 'text-white/70'}`}
            {...rest}
        >
            {children}
        </button>
    );
}
