import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { ArrowDownUp, ChevronDown, FileVideoCamera, LayoutDashboard, LogOut, Settings, User, type LucideIcon } from 'lucide-react';
import type { ProfileDTO, UserRole } from '@duckflixapp/shared';
import { useAuth } from '../../hooks/use-auth';

enum Action {
    SwitchProfile,
    NavigateAdmin,
    NavigateAccount,
    NavigateUpload,
}

type MenuItem = { label: string; icon: LucideIcon; action: Action; role?: UserRole | undefined };

const menuItems: MenuItem[] = [
    {
        label: 'Switch Profiles',
        icon: ArrowDownUp,
        action: Action.SwitchProfile,
    },
    {
        label: 'Admin Panel',
        icon: LayoutDashboard,
        action: Action.NavigateAdmin,
        role: 'admin',
    },
    {
        label: 'Settings',
        icon: Settings,
        action: Action.NavigateAccount,
    },
    {
        label: 'Upload',
        icon: FileVideoCamera,
        action: Action.NavigateUpload,
        role: 'contributor',
    },
];

export default function UserMenu() {
    const auth = useAuth();
    const { logout: switchProfile } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!auth || !auth.account) return null;

    const items = menuItems.filter((i) => !i.role || auth.hasRole(i.role));

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 py-3 rounded-full px-3 cursor-pointer text-sm font-semibold transition-all ${
                    isOpen ? 'bg-white/14 text-text shadow-lg shadow-black/10' : 'text-text/72 hover:bg-white/7 hover:text-text'
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="rounded-lg">
                    <User size={18} />
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <Menu
                profile={auth.profile}
                email={auth.account.email}
                items={items}
                switchProfile={switchProfile}
                logout={auth.logout}
                open={isOpen}
                close={() => setIsOpen(false)}
            />
        </div>
    );
}

function Menu({
    profile,
    email,
    items,
    switchProfile,
    logout,
    open,
    close,
}: {
    profile: ProfileDTO | null;
    email: string;
    items: MenuItem[];
    switchProfile: () => unknown;
    logout: () => unknown;
    open: boolean;
    close: () => unknown;
}) {
    const navigate = useNavigate();

    if (!open) return null;

    const displayName = profile?.name ?? 'Account';

    const doAction = (action: Action): unknown => {
        if (action === Action.SwitchProfile) return switchProfile();
        if (action === Action.NavigateAccount) return navigate('/account');
        if (action === Action.NavigateAdmin) return navigate('/admin');
        if (action === Action.NavigateUpload) return navigate('/upload');
        return null;
    };

    return (
        <div
            className="fixed sm:absolute top-18 sm:top-full left-4 right-4 sm:left-auto sm:right-0 
                    mt-2 sm:mt-4 sm:w-64 bg-background/76 backdrop-blur-3xl 
                    border border-white/12 rounded-3xl
                    shadow-2xl z-1000 overflow-hidden animate-in fade-in slide-in-from-top-4"
        >
            <div className="p-2 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-2.5 py-3 mb-1 border-b border-white/5">
                    {profile && profile.avatar.url && (
                        <div className="flex-none w-10 rounded-xl overflow-clip">
                            <img src={profile.avatar.url} alt="Profile picture" />
                        </div>
                    )}
                    <div className="flex-1 pl-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate line-clamp-1">{displayName}</p>
                        <p className="text-xs text-text/40 truncate line-clamp-1">{email}</p>
                    </div>
                </div>

                {items.map((item, idx) => (
                    <button
                        type="button"
                        key={idx}
                        onClick={() => {
                            doAction(item.action);
                            close();
                        }}
                        className="flex items-center gap-3 w-full py-2.5 px-3.5 text-left text-[13px] cursor-pointer font-medium text-text/80 hover:bg-white/5 hover:text-primary rounded-2xl transition-all group"
                    >
                        <item.icon size={16} className="group-hover:scale-110 transition-transform" />
                        {item.label}
                    </button>
                ))}

                <div className="h-px bg-white/5 my-1" />

                <button
                    type="button"
                    onClick={() => {
                        logout();
                        close();
                    }}
                    className="flex items-center gap-3 w-full py-2.5 px-3.5 text-left text-[13px] cursor-pointer font-medium text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
                >
                    <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                    Logout
                </button>
            </div>
        </div>
    );
}
