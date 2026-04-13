import { Home, Library, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();

    const navItems = [
        { path: '/browse', icon: Home, label: 'Home' },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/library', icon: Library, label: 'Library' },
    ];

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-3xl border-t border-white/5 px-6 z-50 pb-safe">
            <ul className="flex justify-around items-center h-full max-w-sm mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname.includes(item.path);
                    return (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? 'text-primary' : 'text-text/50 hover:text-text/80'}`}
                            >
                                <item.icon size={20} className={isActive ? 'fill-primary/20' : ''} />
                                <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
