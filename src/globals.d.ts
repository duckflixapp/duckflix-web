import '@types/chromecast-caf-sender';
import '@types/chrome';

declare global {
    interface Window {
        __onGCastApiAvailable: ((isAvailable: boolean) => void) | undefined;
        cast: typeof cast;
        chrome: typeof chrome;
    }
}

export {};
