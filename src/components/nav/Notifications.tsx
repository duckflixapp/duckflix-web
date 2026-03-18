import { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../hooks/use-notifications';
import type { NotificationDTO } from '@duckflix/shared';
import { timeAgo } from '../../utils/format';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { useNavigate } from 'react-router-dom';

export function NotificationBox() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, refresh, clear, isClearing, mark, isMarking } = useNotifications();
    const containerRef = useRef<HTMLDivElement>(null);

    useNotificationSocket(() => {
        refresh();
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!notifications) return null;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="relative" ref={containerRef}>
            <button
                className={`bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-3xl text-text/60 transition-all cursor-pointer hover:bg-white/5 ${isOpen ? 'ring-2 ring-primary/50 text-primary' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-center p-3 relative">
                    <Bell size={18} className={unreadCount > 0 ? 'animate-pulse text-primary' : ''} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                    )}
                </div>
            </button>

            {/* Dropdown Box */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-4 w-95 bg-background/40 backdrop-blur-3xl border border-white/10 rounded-4xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2">
                        <div>
                            <h3 className="text-sm font-bold text-text tracking-tight">Activity Center</h3>
                            <p className="text-[10px] text-text/40 uppercase tracking-widest font-bold mt-0.5">
                                {unreadCount} New Messages
                            </p>
                        </div>
                        {notifications.length > 0 && (
                            <div className="flex gap-4">
                                {unreadCount > 0 && (
                                    <button
                                        disabled={isMarking}
                                        onClick={() => mark([])}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer uppercase tracking-tighter"
                                    >
                                        {isMarking ? 'Sinking...' : 'Read All'}
                                    </button>
                                )}
                                <button
                                    disabled={isClearing}
                                    onClick={() => clear()}
                                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer uppercase tracking-tighter"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-112.5 overflow-y-auto custom-scrollbar p-2">
                        {notifications.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {notifications.map((n) => (
                                    <NotificationItem key={n.id} notification={n} mark={() => mark([n.id])} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-center opacity-20">
                                <Bell size={48} strokeWidth={1} className="mb-4" />
                                <p className="text-sm italic">The pond is quiet today...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const iconMap = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    success: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

function NotificationItem({ notification: n, mark }: { notification: NotificationDTO; mark: () => unknown }) {
    const navigate = useNavigate();
    const config = iconMap[n.type] || iconMap.info;
    const Icon = config.icon;

    const handleClick = () => {
        mark();
        if (n.movieId) navigate(`/details/${n.movieId}${n.movieVerId ? '?settings=versions&version=' + n.movieVerId : ''}`);
    };

    return (
        <div
            onClick={handleClick}
            className="group relative p-4 rounded-3xl transition-all hover:bg-white/5 border border-transparent hover:border-white/5 cursor-default overflow-hidden"
        >
            {!n.isRead && <div className="absolute inset-0 bg-primary/2 pointer-events-none" />}

            <div className="flex gap-4 relative z-10">
                <div
                    className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${config.bg} ${config.color}`}
                >
                    <Icon size={20} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-[13px] font-bold text-text/90 leading-tight truncate">{n.title}</h4>
                        <div className="flex items-center gap-1.5 shrink-0 text-text/30 font-bold uppercase text-[8px] tracking-wider">
                            <History size={10} />
                            <span>{timeAgo(n.createdAt)}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-text/40 leading-snug line-clamp-2 pr-4">{n.message}</p>
                </div>

                {!n.isRead && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                    </div>
                )}
            </div>
        </div>
    );
}
