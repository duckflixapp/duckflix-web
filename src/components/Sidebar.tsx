import { Link } from 'react-router-dom';
import { sidebarConfig } from '../config/sidebar';
import type { LucideIcon } from 'lucide-react';

export default function Sidebar() {
    return (
        <div className="absolute w-56 h-full px-8 flex flex-col z-50">
            <div className="h-18 flex items-center gap-6">
                <Link to="/browse" className="flex items-center gap-2 text-white font-bold text-xl uppercase">
                    Duckflix
                </Link>
            </div>
            <div className="flex flex-col items-start gap-12 mt-4">
                {sidebarConfig.map((group, idx) => (
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
                ))}
            </div>
        </div>
    );
}

function SidebarItem({ link, icon: Icon, text }: { link: string; icon: LucideIcon; text: string }) {
    return (
        <Link to={link}>
            <div title={text} className="flex items-center gap-4 text-sm">
                <Icon size={20} color="white" />
                <span>{text}</span>
            </div>
        </Link>
    );
}
