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
    Volume2,
    VolumeOff,
    Volume1,
    Volume,
    Loader2,
    Cast,
} from 'lucide-react';
import { useMovieDetail } from '../hooks/use-movie-detailed';
import { getQualityLabel, srtToVtt } from '../utils/format';
import { SettingsBox } from '../components/player/WatchSettings';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { PlayerOverlay } from '../components/player/PlayerOverlay';
import { ProgressBar } from '../components/player/ProgressBar';
import { playerShortcuts } from '../config/player';
import { ResumeNotification } from '../components/player/ResumeNotification';
import type { MovieVersionDTO, SubtitleDTO } from '@duckflix/shared';
import Hls from 'hls.js';

const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function WatchPage() {
    const { id } = useParams<{ id: string }>();
    const { movie, isLoading } = useMovieDetail(id);
    const navigate = useNavigate();

    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [subtitle, setSubtitle] = useState<SubtitleDTO | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const timeDisplayRef = useRef<HTMLSpanElement>(null);
    const videoStateRef = useRef<boolean>(false);

    const lastActionTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrubPercentRef = useRef<number | null>(null);
    const lastActiveSubtitleIdRef = useRef<string>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [manualRes, setManualRes] = useState<number | null>(null);
    const [localSubs, setLocalSubs] = useState<SubtitleDTO[]>([]);
    const availableVersions =
        movie?.versions
            .filter((v) => v.mimeType && ['video/mp4', 'application/x-mpegURL'].includes(v.mimeType) && v.status === 'ready')
            .sort((a, b) => b.height - a.height) || [];
    const activeVersion = manualRes
        ? (availableVersions.find((v) => v.height === manualRes) ?? availableVersions[0])
        : availableVersions[0];

    const actionCallback = () => {
        lastActionTimeRef.current = Date.now();
        setShowControls(true);
    };

    const player = useVideoPlayer(actionCallback);
    const { videoRef } = player;

    // progress memory
    const saveProgress = useCallback(() => {
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
            if (!videoRef.current || !progressBarRef.current) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const clientX = e.clientX;
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

            scrubPercentRef.current = pos * 100;

            const newTime = pos * videoRef.current.duration;

            if (timeDisplayRef.current) {
                timeDisplayRef.current.innerText = `${formatTime(newTime)} / ${formatTime(videoRef.current.duration)}`;
            }

            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                }
            }, 100);
        },
        [videoRef]
    );

    const onScrubEnd = useCallback(() => {
        if (!videoStateRef.current && videoRef.current && videoRef.current.currentTime !== videoRef.current.duration)
            videoRef.current.play();
    }, [videoRef]);

    useEffect(() => {
        if (!isScrubbing) return;
        if (!videoStateRef.current && videoRef.current) videoRef.current.pause();

        const onMove = (e: MouseEvent) => handleSeek(e);
        const onUp = () => {
            setIsScrubbing(false);
            onScrubEnd();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isScrubbing, handleSeek, videoRef, onScrubEnd]);

    const toggleSettings = () => {
        setIsSettingsOpen((p) => !p);
    };

    const toggleSubtitles = useCallback(() => {
        if (subtitle) setSubtitle(null);
        else if (movie && (movie.subtitles.length > 0 || localSubs.length > 0)) {
            const code = localStorage.getItem('prefered-subtitle-lang');
            const filter =
                lastActiveSubtitleIdRef.current != null
                    ? (t: SubtitleDTO) => t.id === lastActiveSubtitleIdRef.current
                    : (t: SubtitleDTO) => t.language === code;

            const s = movie.subtitles.find(filter) ?? localSubs.find(filter);
            if (s) setSubtitle(s);
            else if (localSubs.length > 0) setSubtitle(localSubs[0]);
            else setSubtitle(movie.subtitles[0]);
        }
    }, [localSubs, movie, subtitle]);

    const changeSubtitle = (s: SubtitleDTO | null) => {
        setSubtitle(s);
        if (!s) return;
        lastActiveSubtitleIdRef.current = s.id;
        if (s.language.startsWith('local')) return;
        localStorage.setItem('prefered-subtitle-lang', s.language);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            playerShortcuts.forEach((shortcut) => {
                if (!shortcut.keys.includes(e.key.toLowerCase())) return;

                if (shortcut.func === 'closeOpenMenu') {
                    if (isSettingsOpen) setIsSettingsOpen(false);
                    else if (showControls) setShowControls(false);
                }

                if (shortcut.func === 'toggleSubtitles') toggleSubtitles();
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSettingsOpen, showControls, toggleSubtitles]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !activeVersion) return;
        console.log('trying to play: ', activeVersion, 'on video element:', videoElement);

        let hls: Hls | null = null;

        if (activeVersion.mimeType === 'application/x-mpegURL') {
            if (!Hls.isSupported()) {
                if (videoElement.canPlayType('application/vnd.apple.mpegurl'))
                    videoElement.setAttribute('src', activeVersion?.streamUrl ?? null);
                else {
                    alert('unsupported');
                    return;
                }
            }
            hls = new Hls();
            hls.loadSource(activeVersion.streamUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    console.error('Fatal HLS error:', data.type);
                }
            });
        } else videoElement.setAttribute('src', activeVersion?.streamUrl ?? null);

        videoElement.load();

        return () => {
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
        };
    }, [activeVersion, videoRef]);

    if (isLoading || !movie)
        return (
            <div className="h-screen bg-black flex items-center justify-center text-primary">
                <Loader2 className="animate-spin" />
            </div>
        );

    const handleChangeResolution = (v: MovieVersionDTO) => {
        const video = videoRef.current;
        if (!video) return;

        const t = video.currentTime;
        const wasPlaying = !video.paused;

        const handleSeekAfterChange = () => {
            video.currentTime = t;
            if (wasPlaying) {
                video.play().catch((e) => console.error('Auto-play failed:', e));
            }
            video.removeEventListener('loadedmetadata', handleSeekAfterChange);
        };

        video.addEventListener('loadedmetadata', handleSeekAfterChange);

        setManualRes(v.height);
    };

    const handleLocalSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            const result = event.target?.result as ArrayBuffer;

            const buffer = result; // Sada TS zna da je ovo ArrayBuffer
            let decoder = new TextDecoder('utf-8');
            let content = decoder.decode(buffer);

            if (content.includes('')) {
                // on fail
                decoder = new TextDecoder('windows-1250');
                content = decoder.decode(buffer);
            }

            if (file.name.toLowerCase().endsWith('.srt')) {
                content = srtToVtt(content);
            }

            const blob = new Blob([content], { type: 'text/vtt' });
            const blobUrl = URL.createObjectURL(blob);

            const localSub = {
                id: `local-${Date.now()}`,
                language: 'local',
                name: file.name.slice(0, 20),
                subtitleUrl: blobUrl,
                movieId: id || '',
                createdAt: new Date().toISOString(),
            };

            setLocalSubs([localSub]);
            setSubtitle(localSub);
        };

        reader.readAsArrayBuffer(file);
    };

    // Helper icons
    const PlayIcon = player.paused ? Play : Pause;
    const FullScrnIcon = player.fullScreen ? Minimize : Maximize;
    const VolumeIcon = player.muted ? VolumeOff : player.volume === 0 ? Volume : player.volume < 5 ? Volume1 : Volume2;

    return (
        <div
            ref={containerRef}
            className={`h-screen w-screen bg-black relative group overflow-hidden ${showControls ? 'cursor-default' : 'cursor-none'} ${isScrubbing ? 'select-none' : ''}`}
            onMouseMove={registerAction}
            onClick={registerAction}
        >
            <video
                ref={videoRef}
                playsInline
                preload="metadata"
                className={`w-full h-full max-h-screen object-contain ${showControls && 'subtitles-up'}`}
                onClick={() => !isScrubbing && player.togglePlay()}
                onWaiting={() => player.setIsBuffering(true)}
                onPlaying={() => player.setIsBuffering(false)}
                onCanPlay={() => player.setIsBuffering(false)}
                onEnded={() => player.setPaused(true)}
                onPause={() => player.setPaused(true)} // e.g. os can pause player
                onPlay={() => player.setPaused(false)}
            >
                {subtitle && (
                    <track
                        key={subtitle.id}
                        kind="subtitles"
                        src={subtitle.subtitleUrl}
                        srcLang={subtitle.language}
                        label={subtitle.language}
                        default
                    />
                )}
            </video>

            {/* TOP BAR */}
            <div
                className={`absolute top-0 left-0 w-full p-8 bg-linear-to-b from-black/80 to-transparent transition-opacity duration-300 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/details/${id}`)}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition cursor-pointer"
                        >
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
                    {player.isCastAvailable && (
                        <button
                            onClick={() =>
                                player.cast({
                                    src: activeVersion.streamUrl,
                                    contentType: activeVersion.mimeType,
                                    title: movie.title,
                                })
                            }
                        >
                            <Cast className="text-white/70 hover:text-white cursor-pointer" />
                        </button>
                    )}
                </div>
            </div>

            <PlayerOverlay paused={isScrubbing ? false : player.paused} isBuffering={player.isBuffering} />

            {id && <ResumeNotification movieId={id} videoRef={videoRef} />}

            {/* BOTTOM CONTROLS */}
            <div
                className={`absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-black/90 to-transparent transition-opacity duration-300 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <ProgressBar
                    ref={progressBarRef}
                    videoRef={videoRef}
                    isScrubbing={isScrubbing}
                    scrubPercentRef={scrubPercentRef}
                    onScrubStart={(e) => {
                        videoStateRef.current = player.paused;
                        setIsScrubbing(true);
                        handleSeek(e);
                    }}
                    onScrubEnd={() => {
                        setIsScrubbing(false);
                        onScrubEnd();
                    }}
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
                            <div className="flex items-center w-0 overflow-hidden group-hover/vol:w-24 group-hover/vol:ml-2 transition-all duration-300 ease-out">
                                <div className="relative w-20 h-1 hover:h-2 transition-all bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
                                        style={{ width: `${(player.volume / 10) * 100}%` }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={player.volume}
                                        onChange={(e) => player.setVolume(Number(e.target.value))}
                                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <span ref={timeDisplayRef} className="text-xs font-mono text-white/60">
                            00:00 / 00:00
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Button onClick={toggleSubtitles} active={subtitle != null}>
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
                                onChangeResolution={handleChangeResolution}
                                playbackSpeed={player.playbackSpeed}
                                onChangeSpeed={player.setPlaybackSpeed}
                                subtitles={[...movie.subtitles, ...localSubs]}
                                activeSubtitle={subtitle}
                                setSubtitle={changeSubtitle}
                                onUploadLocal={() => fileInputRef.current?.click()}
                            />
                        </div>

                        <div>
                            <Button
                                onClick={() => {
                                    // setIsSettingsOpen(false);
                                    player.toggleFullScreen();
                                }}
                            >
                                <FullScrnIcon size={21} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => handleLocalSubtitleUpload(e)} accept=".vtt,.srt" className="hidden" />
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
