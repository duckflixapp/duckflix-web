import { useState, useRef, useEffect, useCallback, type ButtonHTMLAttributes, useMemo } from 'react';
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
import { srtToVtt } from '../utils/format';
import { SettingsBox } from '../components/player/WatchSettings';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { PlayerOverlay } from '../components/player/PlayerOverlay';
import { ProgressBar } from '../components/player/ProgressBar';
import { playerShortcuts } from '../config/player';
import { ResumeNotification } from '../components/player/ResumeNotification';
import type { VideoVersionDTO, SubtitleDTO } from '@duckflix/shared';
import Hls from 'hls.js';
import { appendSubtitleName } from '../utils/subtitles';
import { api } from '../lib/api';
import { useVideo } from '../hooks/useVideo';

const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function WatchPage() {
    const { id } = useParams<{ id: string }>();
    const { video, isLoading } = useVideo(id);
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

    const hlsRef = useRef<Hls | null>(null);
    const [hlsLevels, setHlsLevels] = useState<Hls['levels']>([]);
    const [currentHlsLevel, setCurrentHlsLevel] = useState<number>(-1);
    const [manualVersion, setManualVersion] = useState<VideoVersionDTO | null>(null);
    const [sessionizedVersions, setSessionizedVersions] = useState<VideoVersionDTO[]>([]);
    const [localSubs, setLocalSubs] = useState<SubtitleDTO[]>([]);
    const [requestedHlsLevel, setRequestedHlsLevel] = useState<number | 'auto'>('auto');

    const title = 'default';

    const availableVersions = useMemo(() => {
        if (!video) return [];
        return [...video.versions, ...(video.generatedVersions ?? [])]
            .filter((v) => v.mimeType && ['video/mp4', 'application/x-mpegURL'].includes(v.mimeType) && v.status === 'ready')
            .sort((a, b) => b.height - a.height);
    }, [video]);

    const autoVersion: VideoVersionDTO = useMemo(
        () => ({
            id: 'auto',
            height: 0,
            width: 0,
            mimeType: 'application/x-mpegURL',
            streamUrl: `${import.meta.env.VITE_API_URL}/media/live/${id}/master.m3u8`,
            status: 'ready',
            isOriginal: false,
            fileSize: null,
        }),
        [id]
    );

    const allVersions = useMemo(() => [...availableVersions, autoVersion], [autoVersion, availableVersions]);
    const versionsForSettings = sessionizedVersions.length > 0 ? sessionizedVersions : allVersions;
    const activeVersion = useMemo(() => manualVersion ?? autoVersion, [manualVersion, autoVersion]);

    const actualVersionForTopBar = useMemo(() => {
        if (hlsLevels.length > 0 && currentHlsLevel >= 0) {
            const level = hlsLevels[currentHlsLevel];
            const versions = sessionizedVersions.length > 0 ? sessionizedVersions : allVersions;
            return versions.find((v) => v.height === level?.height) ?? autoVersion;
        }
        return autoVersion;
    }, [currentHlsLevel, hlsLevels, sessionizedVersions, allVersions, autoVersion]);

    const activeVersionForDisplay = useMemo(() => {
        if (hlsLevels.length > 0) {
            if (requestedHlsLevel === 'auto') return autoVersion;
            const level = hlsLevels[requestedHlsLevel];
            const versions = sessionizedVersions.length > 0 ? sessionizedVersions : allVersions;
            return versions.find((v) => v.height === level?.height) ?? autoVersion;
        }
        return activeVersion;
    }, [requestedHlsLevel, hlsLevels, sessionizedVersions, allVersions, activeVersion, autoVersion]);

    const actionCallback = () => {
        lastActionTimeRef.current = Date.now();
        setShowControls(true);
    };

    const player = useVideoPlayer(actionCallback);
    const { videoRef, videoElement, videoCallbackRef } = player;

    // progress memory
    const saveProgress = useCallback(() => {
        if (!videoElement) return;

        if (!videoElement.paused && videoElement.currentTime > 10 && videoElement.currentTime < videoElement.duration - 10)
            localStorage.setItem(`watch-progress-${id}`, videoElement.currentTime.toString());

        if (videoElement.currentTime > videoElement.duration - 10) localStorage.removeItem(`watch-progress-${id}`);
    }, [id, videoElement]);

    // UI Effects
    useEffect(() => {
        const video = videoElement;
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
    }, [videoElement, activeVersion, saveProgress]);

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
            if (!videoElement || !progressBarRef.current) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const clientX = e.clientX;
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

            scrubPercentRef.current = pos * 100;

            const newTime = pos * videoElement.duration;

            if (timeDisplayRef.current) {
                timeDisplayRef.current.innerText = `${formatTime(newTime)} / ${formatTime(videoElement.duration)}`;
            }

            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                if (videoElement) {
                    videoElement.currentTime = newTime;
                }
            }, 100);
        },
        [videoElement]
    );

    const onScrubEnd = useCallback(() => {
        if (!videoStateRef.current && videoElement && videoElement.currentTime !== videoElement.duration) videoElement.play();
    }, [videoElement]);

    useEffect(() => {
        if (!isScrubbing) return;
        if (!videoStateRef.current && videoElement) videoElement.pause();

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
    }, [isScrubbing, handleSeek, videoElement, onScrubEnd]);

    const toggleSettings = () => {
        setIsSettingsOpen((p) => !p);
    };

    const toggleSubtitles = useCallback(() => {
        if (subtitle) setSubtitle(null);
        else if (video && (video.subtitles.length > 0 || localSubs.length > 0)) {
            const code = localStorage.getItem('prefered-subtitle-lang');
            const filter =
                lastActiveSubtitleIdRef.current != null
                    ? (t: SubtitleDTO) => t.id === lastActiveSubtitleIdRef.current
                    : (t: SubtitleDTO) => t.language === code;

            const s = video.subtitles.find(filter) ?? localSubs.find(filter);
            if (s) setSubtitle(s);
            else if (localSubs.length > 0) setSubtitle(localSubs[0]);
            else setSubtitle(video.subtitles[0]);
        }
    }, [localSubs, video, subtitle]);

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
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                maxBufferLength: 24,
                maxMaxBufferLength: 48,
                startFragPrefetch: false,
                autoStartLoad: true,
                capLevelToPlayerSize: true,
                startLevel: -1,
                abrEwmaDefaultEstimate: 5000000,
            });
            hlsRef.current = hls;

            hls.loadSource(activeVersion.streamUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                setCurrentHlsLevel(data.level);
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) console.error('Fatal HLS error:', data.type);
            });
            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                setRequestedHlsLevel('auto');
                setHlsLevels(data.levels);
                const firstUrl = data.levels[0]?.url[0] ?? '';
                const session = new URL(firstUrl, window.location.origin).searchParams.get('session');

                if (!session) return;

                setSessionizedVersions(
                    allVersions.map((v) => (v.id.startsWith('live-') ? { ...v, streamUrl: `${v.streamUrl}?session=${session}` } : v))
                );
            });
        } else {
            hlsRef.current = null;
            setCurrentHlsLevel(-1);
            videoElement.setAttribute('src', activeVersion?.streamUrl ?? null);
        }

        videoElement.load();
        api.post(`/movies/${id}/watch`).catch(() => {});

        return () => {
            hlsRef.current = null;
            setCurrentHlsLevel(-1);
            setHlsLevels([]);
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
            hls?.destroy();
        };
    }, [activeVersion, allVersions, id, videoElement]);

    const castVideo = useCallback(() => {
        if (!activeVersion || !video) return;
        const subtitles = appendSubtitleName(video.subtitles);
        player.cast({
            src: activeVersion.streamUrl,
            contentType: activeVersion.mimeType,
            title: title,
            subtitles: subtitles.map((s, idx) => ({
                id: idx,
                url: s.subtitleUrl,
                language: s.language,
                label: s.name,
            })),
            activeSubtitle: subtitles.findIndex((s) => s.id === subtitle?.id),
        });
    }, [player, activeVersion, video, subtitle]);

    if (isLoading || !video)
        return (
            <div className="h-screen bg-black flex items-center justify-center text-primary">
                <Loader2 className="animate-spin" />
            </div>
        );

    const handleChangeResolution = (v: VideoVersionDTO) => {
        const video = videoElement;
        if (!video) return;

        const isAuto = v.id === 'auto' || v.height === 0;
        const isHlsVersion = v.mimeType === 'application/x-mpegURL';

        if (hlsRef.current && (isAuto || isHlsVersion)) {
            if (isAuto) {
                hlsRef.current.currentLevel = -1;
                setRequestedHlsLevel('auto');
            } else {
                const idx = hlsLevels.findIndex((l) => l.height === v.height);
                if (idx !== -1) {
                    hlsRef.current.currentLevel = idx;
                    setRequestedHlsLevel(idx);
                }
            }
            return;
        }

        if (isAuto) {
            setManualVersion(null);
            return;
        }

        const t = video.currentTime;
        const wasPlaying = !video.paused;

        const onLoaded = () => {
            video.currentTime = t;
            if (wasPlaying) {
                video.play().catch((e) => console.error('Auto-play failed:', e));
            }
            video.removeEventListener('loadedmetadata', onLoaded);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        setManualVersion(v);
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
                videoId: video.id || '',
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
                ref={videoCallbackRef}
                playsInline
                preload="metadata"
                crossOrigin="use-credentials"
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
                            <h1 className="text-white font-bold text-lg leading-none">{title}</h1>
                            {actualVersionForTopBar && actualVersionForTopBar.height ? (
                                <div className="flex items-center gap-2">
                                    <p className="text-white/40 text-xs font-bold uppercase mt-1">{actualVersionForTopBar.height}p</p>
                                    {actualVersionForTopBar.streamUrl.includes('/live/') ? (
                                        <p className="text-white/40 text-xs font-bold uppercase mt-1">LIVE</p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {player.isCastAvailable && (
                        <button onClick={castVideo}>
                            <Cast className="text-white/70 hover:text-white cursor-pointer" />
                        </button>
                    )}
                </div>
            </div>

            <PlayerOverlay paused={isScrubbing ? false : player.paused} isBuffering={player.isBuffering} />

            {id && <ResumeNotification videoId={video.id} videoRef={videoRef} />}

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
                                versions={versionsForSettings}
                                activeVersion={activeVersionForDisplay}
                                onChangeResolution={handleChangeResolution}
                                playbackSpeed={player.playbackSpeed}
                                onChangeSpeed={player.setPlaybackSpeed}
                                subtitles={[...video.subtitles, ...localSubs]}
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
            className={`p-2.5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer ${active ? 'text-primary bg-white/10' : 'text-white/70'}`}
            {...rest}
        >
            {children}
        </button>
    );
}
