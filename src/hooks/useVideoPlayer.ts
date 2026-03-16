import { useState, useRef, useEffect, useCallback } from 'react';
import { playerShortcuts, type PlayerFunc } from '../config/player';
import { initializeGoogleCast } from '../utils/google.cast';

export function useVideoPlayer(actionCallback: () => unknown) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setIsPaused] = useState(true);
    const [volume, setVolume] = useState(10);
    const [muted, setMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isBuffering, setIsBuffering] = useState(false);
    const [fullScreen, setFullScreen] = useState(document.fullscreenElement !== null);
    const [isCastAvailable, setIsCastAvailable] = useState(false);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    // const [castSession, setCastSession] = useState(null);

    // sync video with state
    useEffect(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        video.volume = volume / 10;
        video.muted = muted;
        video.playbackRate = playbackSpeed;

        if (video.paused && !paused) video.play().catch(() => setIsPaused(true));
        else if (!video.paused && paused) video.pause();
    }, [volume, muted, paused, playbackSpeed, fullScreen]);

    // Fullscreen listener
    useEffect(() => {
        const onScreenChange = () => setFullScreen(document.fullscreenElement !== null);
        document.addEventListener('fullscreenchange', onScreenChange);
        return () => document.removeEventListener('fullscreenchange', onScreenChange);
    }, []);

    // Actions
    const togglePlay = useCallback(() => {
        setIsPaused((p) => !p);
        actionCallback();
    }, [actionCallback]);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        actionCallback();
    }, [actionCallback]);

    const seek = useCallback(
        (seconds: number) => {
            if (!videoRef.current) return;

            videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));

            actionCallback();
        },
        [actionCallback]
    );

    const changeVolume = useCallback(
        (delta: number) => {
            setMuted(false);
            setVolume((prev) => Math.max(0, Math.min(10, prev + delta)));
            actionCallback();
        },
        [actionCallback]
    );

    const toggleMute = useCallback(() => {
        setMuted((p) => !p);
        actionCallback();
    }, [actionCallback]);

    // Keyboard shortcuts
    useEffect(() => {
        const executeAction = (func: PlayerFunc) => {
            if (func === 'togglePause') return togglePlay();
            if (func === 'toggleFullscreen') return toggleFullScreen();
            if (func === 'seekBackward') return seek(-10);
            if (func === 'seekForward') return seek(10);
            if (func === 'toggleMute') return toggleMute();
            if (func === 'volumeDown') return changeVolume(-1);
            if (func === 'volumeUp') return changeVolume(1);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const keyPressed = e.key === ' ' ? 'space' : e.key.toLowerCase();
            const isShortcut = playerShortcuts.some((s) => s.keys.includes(keyPressed));
            if (!isShortcut) return;

            e.preventDefault();
            playerShortcuts.forEach((shortcut) => {
                if (!shortcut.keys.includes(keyPressed)) return;
                executeAction(shortcut.func);
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullScreen, seek, changeVolume, toggleMute]);

    // cast
    useEffect(() => {
        window['__onGCastApiAvailable'] = (available: boolean) => {
            setIsCastAvailable(available);
            if (available) initializeGoogleCast();
        };
        if (!document.body.querySelector('#googleCastSender')) {
            const script = document.createElement('script');
            script.setAttribute('id', 'googleCastSender');
            script.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
            document.body.appendChild(script);
        }
    }, []);

    const handleCast = useCallback(
        async (videoContext: {
            src: string;
            contentType: string | null;
            title: string;
            subtitles: { url: string; language: string; label: string; id: number }[];
            activeSubtitle: number;
        }) => {
            if (!videoRef.current) return;
            const context = cast.framework.CastContext.getInstance();

            try {
                if (!context.getCurrentSession()) await context.requestSession();
                const session = context.getCurrentSession();
                if (!session) return;

                const mediaInfo = new chrome.cast.media.MediaInfo(videoContext.src, videoContext.contentType ?? 'video/mp4');
                mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;

                if (videoContext.subtitles && videoContext.subtitles.length > 0) {
                    const tracks = videoContext.subtitles.map((sub) => {
                        const track = new chrome.cast.media.Track(sub.id, chrome.cast.media.TrackType.TEXT);
                        track.trackContentId = sub.url;
                        track.trackContentType = 'text/vtt';
                        track.subtype = chrome.cast.media.TextTrackType.SUBTITLES;
                        track.name = sub.label;
                        track.language = sub.language;
                        return track;
                    });

                    mediaInfo.tracks = tracks;
                }

                const metadata = new chrome.cast.media.GenericMediaMetadata();
                metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
                metadata.title = videoContext.title;
                mediaInfo.metadata = metadata;

                const request = new chrome.cast.media.LoadRequest(mediaInfo);

                if (videoContext.activeSubtitle !== -1 && videoContext.subtitles.length > 0)
                    request.activeTrackIds = [videoContext.activeSubtitle];

                console.log(videoContext);

                request.autoplay = true;
                request.currentTime = videoRef.current.currentTime;

                session
                    .loadMedia(request)
                    .then(() => console.log('success'))
                    .catch((e) => console.error(e));
            } catch (e) {
                console.log(e);
            }
        },
        [videoRef]
    );

    const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
        if (node == null) return;
        setVideoElement(node);
        videoRef.current = node;
    }, []);

    return {
        videoRef,
        videoElement,
        videoCallbackRef,
        paused,
        setPaused: setIsPaused,
        volume,
        setVolume,
        muted,
        toggleMute,
        playbackSpeed,
        setPlaybackSpeed,
        fullScreen,
        toggleFullScreen,
        isBuffering,
        setIsBuffering,
        togglePlay,
        isCastAvailable,
        cast: handleCast,
    };
}
