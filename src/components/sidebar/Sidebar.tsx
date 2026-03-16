import { Link, useLocation } from 'react-router-dom';
import { adminSidebar, sidebar } from '../../config/sidebar';
import { Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Sidebar({
    admin = false,
    isCollapsed,
    setIsCollapsed,
}: {
    admin?: boolean;
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}) {
    const auth = useAuthContext();
    const location = useLocation();

    if (!auth) return null;

    const items = admin ? adminSidebar : sidebar;

    return (
        <div
            className={`
                absolute h-full flex flex-col z-50 transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-20 px-2' : 'w-56 lg:w-64 pr-2 pl-4 md:pl-6 lg:pl-7'}
            `}
        >
            <div className={`h-18 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-3xl transition-colors cursor-pointer shrink-0"
                >
                    <Menu size={24} />
                </button>

                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <Link to="/browse" className="flex items-center gap-2">
                            <span className="text-white font-black text-2xl uppercase tracking-tighter transition-colors">Duckflix</span>
                        </Link>
                        {admin && (
                            <div className="flex items-center self-center px-2 py-1 rounded-lg bg-primary/20 border border-none backdrop-blur-md select-none shrink-0">
                                <p className="font-black uppercase text-[10px] tracking-[0.15em] text-primary leading-none">Admin</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`flex flex-col mt-3 ${isCollapsed ? 'items-start' : 'items-start gap-8'}`}>
                {items.map(
                    (group, idx) =>
                        auth.hasRole(group.role ?? null) && (
                            <div key={idx} className={`flex flex-col mt-1 ${!isCollapsed && 'gap-2'} w-full`}>
                                {!isCollapsed && group.title && (
                                    <h3 className="text-[10px] pl-3 uppercase tracking-[0.2em] text-white/40 font-medium mb-1">
                                        {group.title}
                                    </h3>
                                )}

                                <div className="flex flex-col gap-1 w-full">
                                    {group.items.map((item) => (
                                        <SidebarItem
                                            key={item.link}
                                            {...item}
                                            isActive={location.pathname === item.link}
                                            isCollapsed={isCollapsed}
                                        />
                                    ))}
                                </div>

                                {isCollapsed && idx !== items.length - 1 && <div className="w-8 h-px bg-white/10 mx-auto my-2" />}
                            </div>
                        )
                )}
            </div>
        </div>
    );
}

function SidebarItem({
    link,
    icon: Icon,
    text,
    isActive,
    isCollapsed,
}: {
    link: string;
    icon: LucideIcon;
    text: string;
    isActive: boolean;
    isCollapsed: boolean;
}) {
    return (
        <Link to={link} className="w-full">
            <div
                title={text}
                className={`
                    flex items-center rounded-3xl transition-all duration-300 group mx-auto
                    ${isActive ? 'bg-primary/15 text-primary' : 'text-white/85 hover:text-white hover:bg-white/5'}
                    ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full gap-4 px-3 py-2'}
                `}
            >
                <Icon size={isCollapsed ? 22 : 18} color="currentColor" className="transition-all shrink-0" />

                {!isCollapsed && <span className="text-sm truncate whitespace-nowrap">{text}</span>}
            </div>
        </Link>
    );
}
