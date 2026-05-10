interface NavbarItem {
    key: string;
    text: string;
}

export const adminNavbar: NavbarItem[] = [
    { key: 'admin', text: 'Overview' },
    { key: 'admin.system', text: 'System' },
    { key: 'admin.users', text: 'Roles' },
];

export const accountNavbar: NavbarItem[] = [
    { key: 'account.profile', text: 'Profile' },
    { key: 'account.security', text: 'Security' },
    { key: 'account.settings', text: 'Settings' },
];

export const navbar: NavbarItem[] = [
    { key: 'browse', text: 'Browse' },
    // { key: 'movies', text: 'Movies' },
    // { key: 'shows', text: 'Shows' },
    { key: 'library', text: 'Library' },
];
