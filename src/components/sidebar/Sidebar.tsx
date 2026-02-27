import { Link, useLocation } from 'react-router-dom';
import { adminSidebar, sidebar } from '../../config/sidebar';
import type { LucideIcon } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Sidebar({ admin = false }: { admin?: boolean }) {
    const auth = useAuthContext();
    const location = useLocation();

    if (!auth) return null;

    const items = admin ? adminSidebar : sidebar;

    return (
        <div className="absolute w-56 transition-all ease-in-out lg:w-64 h-full pr-2 pl-4 md:pl-6 lg:pl-7 flex flex-col z-50">
            <div className="h-18 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Link to="/browse" className="group flex items-center gap-2">
                        <span className="text-white font-black text-2xl uppercase tracking-tighter transition-colors">Duckflix</span>
                    </Link>
                    {admin && (
                        <div className="flex items-center self-center px-3 py-1.5 rounded-xl bg-primary/20 border border-none backdrop-blur-md select-none">
                            <p className="font-black uppercase text-[10px] tracking-[0.15em] text-primary leading-none">Admin</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-start gap-12 mt-4">
                {items.map(
                    (group, idx) =>
                        auth.hasRole(group.role ?? null) && (
                            <div key={idx} className="flex flex-col gap-2 w-full">
                                {group.title && (
                                    <h3 className="text-[10px] pl-3 uppercase tracking-[0.2em] text-white/40 font-medium mb-2">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    {group.items.map((item) => (
                                        <SidebarItem key={item.link} {...item} isActive={location.pathname === item.link} />
                                    ))}
                                </div>
                            </div>
                        )
                )}
            </div>
        </div>
    );
}

function SidebarItem({ link, icon: Icon, text, isActive }: { link: string; icon: LucideIcon; text: string; isActive: boolean }) {
    return (
        <Link to={link}>
            <div
                title={text}
                className={`
                    w-full flex items-center gap-4 px-3 py-2 rounded-2xl transition-all duration-300 group
                    ${isActive ? 'bg-primary/15 text-primary' : 'text-white/85 hover:text-white hover:bg-white/5'}
                `}
            >
                <Icon size={18} color="currentColor" />
                <span className="text-sm">{text}</span>
            </div>
        </Link>
    );
}
