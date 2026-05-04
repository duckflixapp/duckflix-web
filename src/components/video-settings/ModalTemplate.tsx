import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Trash2, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    title: string;
    onClose?: () => void;
    onDelete?: () => void;
    isDeleting: boolean;
    deleteLabel?: string;
    tabs: Tab[];
    tab: SettingsTab;
    setTab: (tabId: SettingsTab) => unknown;
    children: ReactNode;
}

export type SettingsTab = 'versions' | 'subtitles' | 'details';
export interface Tab {
    id: SettingsTab;
    label: string;
    icon: LucideIcon;
}

export function ModalTemplate({ title, onClose, onDelete, isDeleting, tabs, tab, setTab, deleteLabel = 'Delete', children }: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        onDelete?.();
    };

    useEffect(() => {
        if (!confirmDelete) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (deleteButtonRef.current?.contains(e.target as Node)) return;
            setConfirmDelete(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [confirmDelete]);

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-5xl h-[85vh] sm:h-full sm:max-h-[75vh] bg-background/60 backdrop-blur-3xl border border-white/10 rounded-3xl sm:rounded-4xl overflow-hidden flex flex-col sm:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* sidebar */}
                    <div className="w-full sm:w-48 md:w-60 shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 p-3 sm:p-5 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible no-scrollbar z-20 bg-white/2 sm:bg-transparent">
                        <div className="hidden sm:block px-3 py-4 mb-2">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Settings</p>
                            <p className="text-white font-semibold text-sm mt-1 truncate">{title}</p>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-1 flex-1">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setTab(id)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-3xl text-sm transition-all cursor-pointer text-left border border-transparent ${
                                        tab === id
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="sm:mt-auto sm:pt-4 mr-12 sm:mr-0 sm:border-t border-white/5 flex items-center ml-2 sm:ml-0">
                            <button
                                ref={deleteButtonRef}
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl sm:rounded-3xl text-xs sm:text-sm transition-all cursor-pointer ${
                                    confirmDelete
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'text-red-500/40 hover:text-red-400 hover:bg-red-500/10 border-transparent'
                                }`}
                            >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                <span className={confirmDelete ? 'inline' : 'hidden sm:inline'}>
                                    {confirmDelete ? 'Confirm' : deleteLabel}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-50 cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
