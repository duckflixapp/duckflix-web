import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Maximize, Volume2, Settings, Loader2, VolumeOff, Volume, Volume1, Minimize } from 'lucide-react';
import { useMovieDetail } from '../hooks/use-movie-detailed';
import { formatBytes, getQualityLabel } from '../utils/format';
import type { MovieVersionDTO } from '@duckflix/shared';
import { playerShortcuts, type PlayerFunc } from '../config/player';

type ResolutionPreference = 'high' | 'medium' | 'low';

const getBestInitialVersion = (versions: MovieVersionDTO[], preferedResolution: ResolutionPreference = 'high') => {
    if (versions.length === 0) return null;

    let selected = versions[0];

    if (preferedResolution === 'medium') {
        selected = versions.find((v) => v.height <= 1080) || versions[versions.length - 1];
    } else if (preferedResolution === 'low') {
        selected = versions.find((v) => v.height <= 720) || versions[versions.length - 1];
    }

    return selected;
};

export default function WatchPage() {
    const { id } = useParams();
    const { data: movie, isLoading } = useMovieDetail(id);
    const navigate = useNavigate();
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(10);
    const [paused, setIsPaused] = useState(true);
    const [fullScreen, setFullScreen] = useState(document.fullscreenElement);
    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [userPreferedResolution, setManuallySelectedResolution] = useState<number | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastActionTimeRef = useRef<number>(0);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const timeDisplayRef = useRef<HTMLSpanElement>(null);
    const requestRef = useRef<number>(0);
    const progressCallbackRef = useRef<() => void>(() => {});
    const bufferBarRef = useRef<HTMLDivElement>(null);
    const [isBuffering, setIsBuffering] = useState(false);

    const updateProgress = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.paused) return;

        const progress = (video.currentTime / video.duration) * 100;

        if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progress}%`;
        }
        if (timeDisplayRef.current) {
            timeDisplayRef.current.innerText = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        }

        requestRef.current = requestAnimationFrame(progressCallbackRef.current);
    }, []);

    // while buffering
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleSeeked = () => setIsBuffering(false);
    const handleEnded = () => setIsPaused(true);
    // update buffer
    const updateBuffer = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.duration === 0) return;

        const buffered = video.buffered;
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            const bufferPercent = (bufferedEnd / video.duration) * 100;

            if (bufferBarRef.current) {
                bufferBarRef.current.style.width = `${bufferPercent}%`;
            }
        }
    }, []);

    useEffect(() => {
        progressCallbackRef.current = updateProgress;
    }, [updateProgress]);

    useEffect(() => {
        if (!paused) {
            requestRef.current = requestAnimationFrame(progressCallbackRef.current);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [paused]);

    const registerAction = useCallback(() => {
        lastActionTimeRef.current = Date.now();
        if (!showControls) setShowControls(true);
    }, [showControls]);

    const availableVersions = movie
        ? movie.versions.filter((v) => v.status === 'ready' && v.mimeType === 'video/mp4').sort((a, b) => b.height - a.height)
        : [];

    const activeVersion = userPreferedResolution
        ? (availableVersions.find((v) => v.height === userPreferedResolution) ?? null)
        : getBestInitialVersion(availableVersions);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            return;
        }
        document.exitFullscreen();
    };

    const seekBackward = () => {
        if (videoRef.current) videoRef.current.currentTime -= 10;
    };
    const seekForward = () => {
        if (videoRef.current) videoRef.current.currentTime += 10;
    };

    const togglePause = () => setIsPaused((prev) => !prev);

    // volume controlls
    const volumeUp = () => {
        setMuted(false);
        setVolume((prev) => Math.min(10, (prev += 1)));
    };
    const volumeDown = () => {
        setMuted(false);
        setVolume((prev) => Math.max(0, prev - 1));
    };
    const toggleMute = () => setMuted((prev) => !prev);

    // apply effects on video element
    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.volume = volume / 10;
        videoRef.current.muted = muted;
        if (videoRef.current.paused && !paused) videoRef.current.play();
        else if (!videoRef.current.paused && paused) videoRef.current.pause();
    }, [volume, muted, paused]);

    // update state on event
    useEffect(() => {
        const onScreenChange = () => setFullScreen(document.fullscreenElement);
        document.addEventListener('fullscreenchange', onScreenChange);
        return () => document.removeEventListener('fullscreenchange', onScreenChange);
    }, []);

    // catch shortcuts
    useEffect(() => {
        const executeAction = (func: PlayerFunc) => {
            registerAction();
            if (func === 'togglePause') return togglePause();
            if (func === 'toggleFullscreen') return toggleFullScreen();
            if (func === 'seekBackward') return seekBackward();
            if (func === 'seekForward') return seekForward();
            if (func === 'toggleMute') return toggleMute();
            if (func === 'volumeDown') return volumeDown();
            if (func === 'volumeUp') return volumeUp();
            if (func === 'closeOpenMenu') {
                if (isSettingsOpen) setIsSettingsOpen(false);
                else if (showControls) setShowControls(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const keyPressed = e.key === ' ' ? 'space' : e.key.toLowerCase();
            playerShortcuts.forEach((shortcut) => {
                if (!shortcut.keys.includes(keyPressed)) return;
                executeAction(shortcut.func);
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSettingsOpen, registerAction, showControls]);

    const changeResolution = (version: MovieVersionDTO) => {
        const currentTime = videoRef.current?.currentTime || 0;
        setIsSettingsOpen(false);
        setManuallySelectedResolution(version.height);

        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime;
                if (!paused) videoRef.current.play();
            }
        }, 100);
    };

    // watchdog for controlls
    useEffect(() => {
        const interval = setInterval(() => {
            const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
            if (timeSinceLastAction > 3000 && !paused && !isSettingsOpen) setShowControls(false);
        }, 1000);

        return () => clearInterval(interval);
    }, [lastActionTimeRef, isSettingsOpen, paused]);

    if (isLoading || !movie) return <Loader />;

    let VolumeIcon;
    if (muted) VolumeIcon = VolumeOff;
    else if (volume == 0) VolumeIcon = Volume;
    else if (volume < 5) VolumeIcon = Volume1;
    else VolumeIcon = Volume2;

    const PlayIcon = paused ? Play : Pause;

    const FullScrnIcon = fullScreen ? Minimize : Maximize;

    return (
        <div
            className={`h-screen w-screen bg-black flex items-center justify-center relative group overflow-hidden ${showControls ? 'cursor-default' : 'cursor-none'}`}
            ref={playerContainerRef}
            onMouseMove={registerAction}
            onMouseDown={registerAction}
            onClick={registerAction}
            onProgress={updateBuffer}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onSeeked={handleSeeked}
            onEnded={handleEnded}
            onCanPlay={() => setIsBuffering(false)}
        >
            <video ref={videoRef} src={activeVersion?.streamUrl} className="w-full h-full max-h-screen" onClick={togglePause} />

            <div
                className={`absolute top-0 left-0 w-full p-8 bg-linear-to-b from-black/90 to-transparent transition-opacity duration-500 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => navigate(`/details/${movie.id}`)}
                        className="flex items-center justify-center text-white/80 hover:text-white transition-all p-2 bg-white/5 rounded-full backdrop-blur-md border border-white/10 cursor-pointer"
                    >
                        <ChevronLeft size={24} />
                    </div>

                    <div className="flex flex-col text-white/80 hover:text-white transition-all">
                        <h1 className="text-xl font-bold tracking-tight leading-none">{movie.title}</h1>
                        {activeVersion && (
                            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-black">
                                Watching in {getQualityLabel(activeVersion.width ?? 0, activeVersion.height)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {paused && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-10 bg-black/10 rounded-full backdrop-blur-lg border border-white/30 text-white animate-in zoom-in duration-300">
                        <Play size={48} fill="currentColor" />
                    </div>
                </div>
            )}

            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/10 backdrop-blur-xs">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={64} className="text-primary animate-spin" />
                    </div>
                </div>
            )}

            <div
                className={`absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-black/90 to-transparent transition-opacity duration-500 z-60 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 relative group/progress cursor-pointer">
                    <div
                        ref={bufferBarRef}
                        className="absolute h-full bg-white/20 rounded-full transition-all duration-300 ease-out"
                        style={{ width: '0%' }}
                    />
                    <div ref={progressBarRef} className="absolute h-full bg-primary rounded-full ease-linear" style={{ width: `0%` }} />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePause} className="text-white hover:text-primary transition-colors cursor-pointer">
                            <PlayIcon size={28} fill="currentColor" />
                        </button>
                        <div className="flex items-center gap-4">
                            <VolumeIcon size={20} className="text-white/50" />
                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 transition-all duration-75" style={{ width: `${volume * 10}%` }} />
                            </div>
                        </div>
                        <span ref={timeDisplayRef} className="text-xs font-mono text-white/50">
                            00:00 / 00:00
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                    isSettingsOpen
                                        ? 'bg-primary/20 border-primary/50 text-primary'
                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                                }`}
                            >
                                <Settings size={20} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
                            </button>

                            <SettingsBox
                                isOpen={isSettingsOpen}
                                onClose={() => setIsSettingsOpen(false)}
                                versions={availableVersions}
                                activeVersion={activeVersion}
                                onChangeResolution={changeResolution}
                            />
                        </div>
                        <button onClick={toggleFullScreen} className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer">
                            <FullScrnIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsBox({
    isOpen,
    onClose: handleClose,
    versions,
    activeVersion,
    onChangeResolution: handleChangeResolution,
}: {
    isOpen: boolean;
    onClose: () => unknown;
    versions: MovieVersionDTO[];
    activeVersion: MovieVersionDTO | null;
    onChangeResolution: (v: MovieVersionDTO) => unknown;
}) {
    const changeResolution = (v: MovieVersionDTO) => {
        if (v === activeVersion) return;
        handleChangeResolution(v);
    };
    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 -z-1" onClick={handleClose} />

            <div className="absolute bottom-full right-0 mb-4 w-56 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold p-3">Select Quality</p>
                <div className="flex flex-col gap-1">
                    {versions.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => changeResolution(v)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-xl text-[12px] transition-all ${
                                activeVersion?.id === v.id
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'hover:bg-white/5 text-white border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{getQualityLabel(v.width ?? 0, v.height)}</span>
                                <span className="text-[9px] opacity-30 uppercase">{v.mimeType?.split('/')[1]}</span>
                            </div>
                            <span className="text-[10px] opacity-40">{v.fileSize ? formatBytes(v.fileSize, 0) : ''}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

function Loader() {
    return (
        <div className="h-screen bg-black flex items-center justify-center text-primary">
            <Loader2 className="animate-spin" />
        </div>
    );
}

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
