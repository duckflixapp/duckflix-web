import { Compass, Library, Lock, MonitorCog, Settings, UserLock, UserPen, type LucideIcon } from 'lucide-react';

interface SidebarItem {
    key: string;
    icon: LucideIcon;
    text: string;
}

interface SidebarGroup {
    title?: string;
    items: SidebarItem[];
    role?: 'contributor' | 'admin';
}

export const adminSidebar: SidebarGroup[] = [
    {
        title: 'Administration',
        role: 'admin',
        items: [
            { key: 'admin', icon: Settings, text: 'Overview' },
            { key: 'admin.system', icon: MonitorCog, text: 'System' },
            { key: 'admin.users', icon: UserLock, text: 'Roles' },
            // { link: '/admin/library', icon: Database, text: 'Content Manager' },
        ],
    },
];

export const accountSidebar: SidebarGroup[] = [
    {
        title: 'Account',
        items: [
            { key: 'account.profile', icon: UserPen, text: 'Profile' },
            { key: 'account.security', icon: Lock, text: 'Security' },
            { key: 'account.settings', icon: Settings, text: 'Settings' },
        ],
    },
];

export const sidebar: SidebarGroup[] = [
    {
        title: 'Menu',
        items: [
            { key: 'browse', icon: Compass, text: 'Browse' },
            { key: 'movies', icon: Compass, text: 'Movies' },
            { key: 'shows', icon: Compass, text: 'Shows' },
            { key: 'library', icon: Library, text: 'My Library' },
        ],
    },
    // {
    //     title: 'Personal',
    //     items: [
    //         { link: '/favorites', icon: Heart, text: 'Favorites' },
    //         { link: '/history', icon: Clock, text: 'Watch History' },
    //     ],
    // },
    // {
    //     role: 'contributor',
    //     title: 'Contribute',
    //     items: [{ key: 'upload', icon: UploadCloud, text: 'Contribute' }],
    // },
];
