export type PlayerFunc =
    | 'togglePause'
    | 'toggleMute'
    | 'toggleFullscreen'
    | 'seekBackward'
    | 'seekForward'
    | 'closeOpenMenu'
    | 'volumeDown'
    | 'volumeUp';
export const playerShortcuts: { keys: string[]; func: PlayerFunc }[] = [
    {
        keys: ['k', 'space'],
        func: 'togglePause',
    },
    {
        keys: ['m'],
        func: 'toggleMute',
    },
    {
        keys: ['f'],
        func: 'toggleFullscreen',
    },
    {
        keys: ['arrowleft'],
        func: 'seekBackward',
    },
    {
        keys: ['arrowright'],
        func: 'seekForward',
    },
    {
        keys: ['arrowdown'],
        func: 'volumeDown',
    },
    {
        keys: ['arrowup'],
        func: 'volumeUp',
    },
    {
        keys: ['escape'],
        func: 'closeOpenMenu',
    },
];
