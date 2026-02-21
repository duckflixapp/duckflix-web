import { Link } from 'react-router-dom';
import { adminSidebar, sidebar } from '../../config/sidebar';
import type { LucideIcon } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Sidebar({ admin = false }: { admin?: boolean }) {
    const auth = useAuthContext();
    if (!auth) return null;

    const items = admin ? adminSidebar : sidebar;

    return (
        <div className="absolute w-48 lg:w-56 h-full px-4 md:px-6 lg:px-8 flex flex-col z-50">
            <div className="h-18 flex items-center gap-6">
                <Link to="/browse" className="flex items-center gap-2 text-white font-bold text-xl uppercase">
                    Duckflix
                </Link>
            </div>
            <div className="flex flex-col items-start gap-12 mt-4">
                {items.map(
                    (group, idx) =>
                        auth.hasRole(group.role ?? null) && (
                            <div key={idx} className="flex flex-col gap-2">
                                {group.title && (
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2">{group.title}</h3>
                                )}
                                <div className="flex flex-col gap-4">
                                    {group.items.map((item) => (
                                        <SidebarItem key={item.link} {...item} />
                                    ))}
                                </div>
                            </div>
                        )
                )}
            </div>
        </div>
    );
}

function SidebarItem({ link, icon: Icon, text }: { link: string; icon: LucideIcon; text: string }) {
    return (
        <Link to={link}>
            <div title={text} className="flex items-center gap-4 text-sm">
                <Icon size={19} color="white" />
                <span className="text-sm">{text}</span>
            </div>
        </Link>
    );
}
