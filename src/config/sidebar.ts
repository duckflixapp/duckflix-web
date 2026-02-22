import { Compass, Library, Settings, UploadCloud, UserLock, type LucideIcon } from 'lucide-react';

interface SidebarItem {
    link: string;
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
            { link: '/admin', icon: Settings, text: 'System' },
            { link: '/admin/roles', icon: UserLock, text: 'Roles' },
            // { link: '/admin/library', icon: Database, text: 'Content Manager' },
        ],
    },
];

export const sidebar: SidebarGroup[] = [
    {
        title: 'Menu',
        items: [
            { link: '/browse', icon: Compass, text: 'Browse' },
            { link: '/library', icon: Library, text: 'My Library' },
        ],
    },
    // {
    //     title: 'Personal',
    //     items: [
    //         { link: '/favorites', icon: Heart, text: 'Favorites' },
    //         { link: '/history', icon: Clock, text: 'Watch History' },
    //     ],
    // },
    {
        role: 'contributor',
        title: 'Contribute',
        items: [{ link: '/upload', icon: UploadCloud, text: 'Upload Movie' }],
    },
];
