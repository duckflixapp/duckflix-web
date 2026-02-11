import { Link } from 'react-router-dom';
import { Compass, UploadCloud, type LucideIcon } from 'lucide-react';

export default function Sidebar() {
    return (
        <div className="absolute w-56 h-full px-8 flex flex-col z-50">
            <div className="h-18 flex items-center gap-6">
                <Link to="/browse" className="flex items-center gap-2 text-white font-bold text-xl uppercase">
                    Duckflix
                </Link>
            </div>
            <div className="flex flex-col items-start gap-4 mt-4">
                <SidebarItem to="/browse" icon={Compass} text="Browse" />
                <SidebarItem to="/upload" icon={UploadCloud} text="Upload" />
            </div>
        </div>
    );
}

function SidebarItem({ to, icon: Icon, text }: { to: string; icon: LucideIcon; text: string }) {
    return (
        <Link to={to}>
            <div className="flex items-center gap-4 text-sm">
                <Icon size={20} color="white" />
                <span>{text}</span>
            </div>
        </Link>
    );
}
