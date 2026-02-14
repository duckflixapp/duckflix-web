import { useState, useRef, useEffect, useCallback } from 'react';
import { playerShortcuts, type PlayerFunc } from '../config/player';

export function useVideoPlayer(actionCallback: () => unknown) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setIsPaused] = useState(true);
    const [volume, setVolume] = useState(10);
    const [muted, setMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isBuffering, setIsBuffering] = useState(false);
    const [fullScreen, setFullScreen] = useState(document.fullscreenElement !== null);
    const [isCastAvailable, setIsCastAvailable] = useState(false);

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
            if (videoRef.current) videoRef.current.currentTime += seconds;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const video = videoRef.current as any;
        if (!video || !video.remote) return;

        const handleAvailabilityChange = (available: boolean) => setIsCastAvailable(available);
        video.remote.watchAvailability(handleAvailabilityChange).catch(() => setIsCastAvailable(true));

        return () => {
            if (video.remote.cancelWatchAvailability) video.remote.cancelWatchAvailability();
        };
    }, []);

    const handleCast = async () => {};

    return {
        videoRef,
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
