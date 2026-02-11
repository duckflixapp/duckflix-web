import { Compass, Library, UploadCloud, type LucideIcon } from 'lucide-react';

interface SidebarItem {
    link: string;
    icon: LucideIcon;
    text: string;
}

interface SidebarGroup {
    title?: string;
    items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
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
        title: 'Contribute',
        items: [{ link: '/upload', icon: UploadCloud, text: 'Upload Movie' }],
    },
];
