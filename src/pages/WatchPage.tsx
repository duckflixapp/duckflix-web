import { API_URL } from '../config';
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
import { DEFAULT_SUBTITLE_CONFIG, SettingsBox, type SubtitleConfig } from '../components/player/WatchSettings';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { PlayerOverlay } from '../components/player/PlayerOverlay';
import { ProgressBar } from '../components/player/ProgressBar';
import { playerShortcuts } from '../config/player';
import { ResumeNotification } from '../components/player/ResumeNotification';
import type { VideoVersionDTO, SubtitleDTO } from '@duckflixapp/shared';
import Hls from 'hls.js';
import { api } from '../lib/api';
import { useVideo } from '../hooks/useVideo';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Single source of truth for what the user has selected
type VersionSelection =
    | { type: 'auto' } // HLS adaptive bitrate
    | { type: 'hls'; height: number } // HLS locked to specific level
    | { type: 'direct'; version: VideoVersionDTO }; // Direct MP4/stream src

const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SUBTITLE_CONFIG_KEY = 'subtitle-delay#';

const appendSession = (url: string, sessionId: string): string => {
    const u = new URL(url);
    u.searchParams.set('session', sessionId);
    return u.toString();
};

export default function WatchPage() {
    const { id } = useParams<{ id: string }>();
    const { video, isLoading, videoResolved } = useVideo(id);
    const { progress: watchProgress, save: saveWatchProgress } = useWatchProgress(id);
    const navigate = useNavigate();

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [subtitle, setSubtitle] = useState<SubtitleDTO | null>(null);
    const [localSubs, setLocalSubs] = useState<SubtitleDTO[]>([]);
    const [isScrubbing, setIsScrubbing] = useState(false);

    // Subtitle configuration
    const [subtitleConfig, setSubtitleConfig] = useLocalStorage<SubtitleConfig>('subtitle-config', DEFAULT_SUBTITLE_CONFIG);
    const [subtitleDelay, setSubtitleDelay] = useState(0);

    // Version selection — replaces manualVersion + requestedHlsLevel
    const [selection, setSelection] = useState<VersionSelection>({ type: 'auto' });
    const selectionRef = useRef<VersionSelection>({ type: 'auto' });

    // HLS runtime state
    const hlsRef = useRef<Hls | null>(null);
    const [hlsLevels, setHlsLevels] = useState<Hls['levels']>([]);
    const [currentHlsLevel, setCurrentHlsLevel] = useState<number>(-1); // what ABR actually switched to

    // Misc refs
    const lastSavedPositionRef = useRef<number | null>(null);
    const lastActionTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const timeDisplayRef = useRef<HTMLSpanElement>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrubPercentRef = useRef<number | null>(null);
    const videoStateRef = useRef<boolean>(false);
    const lastActiveSubtitleIdRef = useRef<string>(null);
    const pendingRestoreRef = useRef<{ time: number; playing: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        selectionRef.current = selection;
    }, [selection]);

    useEffect(() => {
        if (!id) return;
        api.post<{ sessionId: string }>('/media/session', { videoId: id })
            .then((data) => setSessionId(data.sessionId))
            .catch(() => {});
    }, [id]);

    // ----- Version derivation -----
    const autoVersion = useMemo<VideoVersionDTO>(
        () => ({
            id: 'auto',
            height: 0,
            width: 0,
            mimeType: 'application/x-mpegURL',
            streamUrl: `${API_URL}/media/live/${id}/master.m3u8${sessionId ? `?session=${sessionId}` : ''}`,
            status: 'ready',
            isOriginal: false,
            fileSize: null,
        }),
        [id, sessionId]
    );

    const availableVersions = useMemo(() => {
        if (!video || !sessionId) return [];
        return [...video.versions, ...(video.generatedVersions ?? [])]
            .filter((v) => v.mimeType && ['video/mp4', 'application/x-mpegURL'].includes(v.mimeType) && v.status === 'ready')
            .sort((a, b) => b.height - a.height)
            .map((v) => ({ ...v, streamUrl: appendSession(v.streamUrl, sessionId) }));
    }, [video, sessionId]);

    const availableSubtitles = useMemo(() => {
        if (!video || !sessionId) return [];
        return video.subtitles.map((s) => ({ ...s, subtitleUrl: appendSession(s.subtitleUrl, sessionId) }));
    }, [video, sessionId]);

    const allVersions = useMemo(() => [...availableVersions, autoVersion], [availableVersions, autoVersion]);

    // What src to actually load — 'auto' and 'hls' both use master.m3u8
    const activeVersion = useMemo(() => {
        if (selection.type === 'direct') return selection.version;
        return autoVersion;
    }, [selection, autoVersion]);

    // What to highlight in Settings UI (user intent)
    const selectedVersionForUI = useMemo(() => {
        if (selection.type === 'direct') return selection.version;
        if (selection.type === 'hls') return allVersions.find((v) => v.height === selection.height) ?? autoVersion;
        return autoVersion;
    }, [selection, allVersions, autoVersion]);

    // What to show in top bar (what ABR actually switched to)
    const playingVersion = useMemo(() => {
        if (hlsLevels.length > 0 && currentHlsLevel >= 0) {
            const level = hlsLevels[currentHlsLevel];
            const found = availableVersions.find((v) => v.height === level?.height);
            return found ?? autoVersion;
        }
        if (selection.type === 'direct') return selection.version;
        return autoVersion;
    }, [currentHlsLevel, hlsLevels, availableVersions, autoVersion, selection]);

    // ----- Player -----
    const actionCallback = useCallback(() => {
        lastActionTimeRef.current = Date.now();
        setShowControls(true);
    }, []);

    const player = useVideoPlayer(actionCallback);
    const { videoRef, videoElement, videoCallbackRef } = player;

    // ----- Progress saving -----

    useEffect(() => {
        if (watchProgress) lastSavedPositionRef.current = watchProgress.lastPosition;
    }, [watchProgress]);

    const handleSaveProgress = useCallback(async () => {
        if (!videoElement) return;
        const progress = parseInt(videoElement.currentTime.toString());
        if (progress === lastSavedPositionRef.current) return;
        lastSavedPositionRef.current = progress;
        saveWatchProgress(progress);
    }, [videoElement, saveWatchProgress]);

    useEffect(() => {
        if (player.paused) return;
        const interval = setInterval(handleSaveProgress, 10000);
        return () => clearInterval(interval);
    }, [player.paused, handleSaveProgress]);

    useEffect(() => {
        const element = videoElement;
        if (!element) return;
        return () => {
            const progress = parseInt(element.currentTime.toString());
            if (progress) saveWatchProgress(progress);
        };
    }, [videoElement, saveWatchProgress]);

    // ----- Time display -----

    useEffect(() => {
        const el = videoElement;
        if (!el) return;

        const updateTime = () => {
            if (timeDisplayRef.current) {
                timeDisplayRef.current.innerText = `${formatTime(el.currentTime)} / ${formatTime(el.duration || 0)}`;
            }
        };

        el.addEventListener('timeupdate', updateTime);
        el.addEventListener('loadedmetadata', updateTime);
        updateTime();
        return () => {
            el.removeEventListener('timeupdate', updateTime);
            el.removeEventListener('loadedmetadata', updateTime);
        };
    }, [videoElement]);

    // ----- Controls autohide -----

    const registerAction = useCallback(() => {
        lastActionTimeRef.current = Date.now();
        if (!showControls) setShowControls(true);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (showControls && Date.now() - lastActionTimeRef.current > 3000 && !player.paused && !isSettingsOpen) {
                setShowControls(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [player.paused, isSettingsOpen]);

    // ----- Scrubbing -----

    const handleSeek = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!videoElement || !progressBarRef.current) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            scrubPercentRef.current = pos * 100;
            const newTime = pos * videoElement.duration;

            if (timeDisplayRef.current) {
                timeDisplayRef.current.innerText = `${formatTime(newTime)} / ${formatTime(videoElement.duration)}`;
            }

            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                if (videoElement) {
                    videoElement.currentTime = newTime;
                    handleSaveProgress();
                }
            }, 100);
        },
        [videoElement, handleSaveProgress]
    );

    const onScrubEnd = useCallback(() => {
        if (!videoStateRef.current && videoElement && videoElement.currentTime !== videoElement.duration) {
            videoElement.play();
        }
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

    const handleTogglePlay = useCallback(() => {
        player.togglePlay();
        handleSaveProgress();
    }, [handleSaveProgress, player.togglePlay]);

    // ----- Subtitles -----

    const toggleSubtitles = useCallback(() => {
        if (subtitle) {
            setSubtitle(null);
            return;
        }
        if (!video || (availableSubtitles.length === 0 && localSubs.length === 0)) return;

        const code = localStorage.getItem('prefered-subtitle-lang');
        const byId = (t: SubtitleDTO) => t.id === lastActiveSubtitleIdRef.current;
        const byLang = (t: SubtitleDTO) => t.language === code;
        const filter = lastActiveSubtitleIdRef.current != null ? byId : byLang;

        const found = availableSubtitles.find(filter) ?? localSubs.find(filter);
        setSubtitle(found ?? localSubs[0] ?? availableSubtitles[0]);
    }, [localSubs, availableSubtitles, video, subtitle]);

    const changeSubtitle = (s: SubtitleDTO | null) => {
        setSubtitle(s);
        if (!s) return;
        lastActiveSubtitleIdRef.current = s.id;
        if (!s.language.startsWith('local')) localStorage.setItem('prefered-subtitle-lang', s.language);
    };

    // ----- Keyboard shortcuts -----

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

    // ----- HLS / video source effect -----

    useEffect(() => {
        if (!videoElement || !activeVersion || !sessionId) return;

        let hls: Hls | null = null;

        if (activeVersion.mimeType === 'application/x-mpegURL') {
            if (!Hls.isSupported()) {
                if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    videoElement.setAttribute('src', activeVersion.streamUrl);
                } else {
                    alert('HLS not supported');
                    return;
                }
            } else {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    maxBufferLength: 24,
                    maxMaxBufferLength: 48,
                    startFragPrefetch: false,
                    autoStartLoad: true,
                    capLevelToPlayerSize: false,
                    startLevel: -1,
                    abrEwmaDefaultEstimate: 5_000_000,
                });
                hlsRef.current = hls;

                hls.loadSource(activeVersion.streamUrl);
                hls.attachMedia(videoElement);

                hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                    setHlsLevels(data.levels);

                    const sel = selectionRef.current;
                    if (sel.type === 'hls') {
                        const idx = data.levels.findIndex((l) => l.height === sel.height);
                        if (idx !== -1) hls!.currentLevel = idx;
                    } else {
                        hls!.currentLevel = -1;
                    }

                    const restore = pendingRestoreRef.current;
                    if (restore) {
                        pendingRestoreRef.current = null;
                        videoElement.currentTime = restore.time;
                        if (restore.playing) videoElement.play().catch(console.error);
                    }
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setCurrentHlsLevel(data.level));
                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) console.error('Fatal HLS error:', data.type);
                });
            }
        } else {
            hlsRef.current = null;
            videoElement.setAttribute('src', activeVersion.streamUrl);
        }

        videoElement.load();

        return () => {
            hls?.destroy();
            hlsRef.current = null;
            setCurrentHlsLevel(-1);
            setHlsLevels([]);
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
        };
    }, [activeVersion, videoElement, sessionId]);

    // ----- Resolution change -----

    const handleChangeResolution = useCallback(
        (v: VideoVersionDTO) => {
            const isAuto = v.id === 'auto' || v.height === 0;
            const isHls = v.mimeType === 'application/x-mpegURL';

            if (isAuto || isHls) {
                if (hlsRef.current) {
                    hlsRef.current.currentLevel = isAuto ? -1 : hlsLevels.findIndex((l) => l.height === v.height);
                } else if (videoElement) {
                    pendingRestoreRef.current = {
                        time: videoElement.currentTime,
                        playing: !videoElement.paused,
                    };
                }
                setSelection(isAuto ? { type: 'auto' } : { type: 'hls', height: v.height });
                return;
            }

            // Direct MP4 — preserve position
            const el = videoElement;
            if (!el) return;
            const t = el.currentTime;
            const wasPlaying = !el.paused;
            const onLoaded = () => {
                el.currentTime = t;
                if (wasPlaying) el.play().catch(console.error);
                el.removeEventListener('loadedmetadata', onLoaded);
            };
            el.addEventListener('loadedmetadata', onLoaded);
            setSelection({ type: 'direct', version: v });
        },
        [hlsLevels, videoElement]
    );

    // Auto-select best ready version on initial load
    useEffect(() => {
        if (!availableVersions.length || initializedRef.current) return;
        const best = availableVersions.find((v) => v.streamUrl.includes('/media/stream/'));
        if (best) {
            initializedRef.current = true;
            handleChangeResolution(best);
        }
    }, [availableVersions, handleChangeResolution]);

    // ----- Cast -----

    const castVideo = useCallback(() => {
        if (!activeVersion || !video) return;
        player.cast({
            src: activeVersion.streamUrl,
            contentType: activeVersion.mimeType,
            title: videoResolved?.name ?? '',
            subtitles: availableSubtitles.map((s, idx) => ({
                id: idx,
                url: s.subtitleUrl,
                language: s.language,
                label: s.name,
            })),
            activeSubtitle: availableSubtitles.findIndex((s) => s.id === subtitle?.id),
        });
    }, [activeVersion, video, availableSubtitles, player, videoResolved, subtitle?.id]);

    const handleResume = useCallback(
        (time: number) => {
            const video = videoRef.current;
            if (!video) return;

            const performSeek = () => {
                video.currentTime = time;
                video.play().catch((err) => {
                    console.warn('Autoplay was prevented:', err);
                });
            };

            if (video.readyState >= 3) {
                performSeek();
            } else {
                const onCanPlay = () => {
                    performSeek();
                    video.removeEventListener('canplay', onCanPlay);
                };
                video.addEventListener('canplay', onCanPlay);
            }
        },
        [videoRef]
    );

    // ----- Local subtitle upload -----

    const handleLocalSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            let decoder = new TextDecoder('utf-8');
            let content = decoder.decode(buffer);
            if (content.includes('')) {
                decoder = new TextDecoder('windows-1250');
                content = decoder.decode(buffer);
            }
            if (file.name.toLowerCase().endsWith('.srt')) content = srtToVtt(content);

            const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/vtt' }));
            const localSub: SubtitleDTO = {
                id: `local-${Date.now()}`,
                language: 'local',
                name: file.name.slice(0, 20),
                externalId: null,
                subtitleUrl: blobUrl,
                videoId: video!.id || '',
                createdAt: new Date().toISOString(),
            };
            setLocalSubs([localSub]);
            setSubtitle(localSub);
        };
        reader.readAsArrayBuffer(file);
    };

    useEffect(() => {
        const { fontFamily, fontColor, fontOpacity, fontSize, bgColor, bgOpacity } = subtitleConfig;

        const colorMap = {
            white: '255, 255, 255',
            black: '0, 0, 0',
            yellow: '255, 220, 0',
            cyan: '0, 255, 255',
            none: null,
        };

        const familyMap = {
            default: 'inherit',
            roboto: "'Roboto', sans-serif",
            arial: 'Arial, sans-serif',
            helvetica: 'Helvetica, sans-serif',
            monospace: 'monospace',
        };

        const color = colorMap[fontColor] ? `rgba(${colorMap[fontColor]}, ${fontOpacity / 100})` : 'white';
        const bg = colorMap[bgColor] ? `rgba(${colorMap[bgColor]}, ${bgOpacity / 100})` : 'transparent';
        const family = familyMap[fontFamily] || 'inherit';

        const style = document.createElement('style');
        style.id = 'subtitle-style';
        style.textContent = `
            video::cue {
                color: ${color} !important;
                background-color: ${bg} !important;
                font-family: ${family} !important;
                font-size: ${fontSize * 0.9}% !important;
                text-shadow: 0 0 4px rgba(0,0,0,0.8);
            }
        `;
        document.getElementById('subtitle-style')?.remove();
        document.head.appendChild(style);
        return () => {
            document.getElementById('subtitle-style')?.remove();
        };
    }, [subtitleConfig]);

    const applyDelay = useCallback(
        (delaySeconds: number) => {
            if (!videoElement || delaySeconds === 0) return;

            const tryApply = () => {
                const track = videoElement.textTracks[0];
                if (!track?.cues?.length) return false;

                Array.from(track.cues).forEach((cue) => {
                    cue.startTime += delaySeconds;
                    cue.endTime += delaySeconds;
                });
                return true;
            };

            if (tryApply()) return;

            const interval = setInterval(() => {
                if (tryApply()) clearInterval(interval);
            }, 100);

            const timeout = setTimeout(() => clearInterval(interval), 5000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        },
        [videoElement, subtitle]
    );

    useEffect(() => {
        if (!subtitle) return;
        const delay = parseFloat(localStorage.getItem(SUBTITLE_CONFIG_KEY + subtitle.id) ?? '0');
        setSubtitleDelay(delay);
    }, [subtitle]);

    useEffect(() => applyDelay(subtitleDelay), [subtitleDelay]);

    const handleChangeSubtitleDelay = useCallback(
        (delay: number) => {
            if (!subtitle) return;

            const key = SUBTITLE_CONFIG_KEY + subtitle.id;
            if (delay === 0) localStorage.removeItem(key);
            else localStorage.setItem(key, String(delay));

            setSubtitleDelay(delay);
        },
        [subtitle]
    );

    // ----- Render -----
    if (isLoading || !video) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-primary">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    const PlayIcon = player.paused ? Play : Pause;
    const FullScrnIcon = player.fullScreen ? Minimize : Maximize;
    const VolumeIcon = player.muted ? VolumeOff : player.volume === 0 ? Volume : player.volume < 5 ? Volume1 : Volume2;

    return (
        <div
            ref={containerRef}
            className={`h-screen w-screen bg-black relative overflow-hidden ${showControls ? 'cursor-default' : 'cursor-none'} ${isScrubbing ? 'select-none' : ''}`}
            onMouseMove={registerAction}
            onClick={registerAction}
        >
            <video
                ref={videoCallbackRef}
                playsInline
                preload="metadata"
                crossOrigin="use-credentials"
                className={`w-full h-full max-h-screen object-contain ${showControls && 'subtitles-up'}`}
                onClick={() => !isScrubbing && handleTogglePlay()}
                onWaiting={() => player.setIsBuffering(true)}
                onPlaying={() => player.setIsBuffering(false)}
                onCanPlay={() => player.setIsBuffering(false)}
                onEnded={() => player.setPaused(true)}
                onPause={() => player.setPaused(true)}
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
                            <h1 className="text-white font-bold text-lg leading-none">{videoResolved?.name}</h1>
                            {playingVersion.height > 0 && (
                                <div className="flex items-center gap-2">
                                    <p className="text-white/40 text-xs font-bold uppercase mt-1">{playingVersion.height}p</p>
                                    {playingVersion.streamUrl.includes('/live/') && (
                                        <p className="text-white/40 text-xs font-bold uppercase mt-1">LIVE</p>
                                    )}
                                </div>
                            )}
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
            {watchProgress && <ResumeNotification watchProgress={watchProgress} videoRef={videoRef} onResume={handleResume} />}

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
                        <button onClick={handleTogglePlay} className="text-white transition-colors cursor-pointer">
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
                        <Button onClick={toggleSubtitles} active={subtitle != null}>
                            <Subtitles size={21} />
                        </Button>

                        <div className="relative">
                            <Button onClick={() => setIsSettingsOpen((p) => !p)} active={isSettingsOpen}>
                                <Settings size={21} className={`transition-all ${isSettingsOpen && 'rotate-90'}`} />
                            </Button>
                            <SettingsBox
                                isOpen={isSettingsOpen}
                                onClose={() => setIsSettingsOpen(false)}
                                versions={allVersions}
                                activeVersion={selectedVersionForUI}
                                onChangeResolution={handleChangeResolution}
                                playbackSpeed={player.playbackSpeed}
                                onChangeSpeed={player.setPlaybackSpeed}
                                subtitles={[...availableSubtitles, ...localSubs]}
                                activeSubtitle={subtitle}
                                setSubtitle={changeSubtitle}
                                onUploadLocal={() => fileInputRef.current?.click()}
                                subtitleConfig={subtitleConfig}
                                onChangeSubtitleConfig={setSubtitleConfig}
                                subtitleDelay={subtitleDelay}
                                onChangeDelay={handleChangeSubtitleDelay}
                                isDelayChangeDisabled={!subtitle}
                            />
                        </div>

                        <Button onClick={player.toggleFullScreen}>
                            <FullScrnIcon size={21} />
                        </Button>
                    </div>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleLocalSubtitleUpload} accept=".vtt,.srt" className="hidden" />
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
