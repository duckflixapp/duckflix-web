import type { MovieVersionDTO } from '@duckflix/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBytes, getQualityLabel } from '../../utils/format';
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Gauge, Layers, Subtitles } from 'lucide-react';

type MenuState = 'main' | 'quality' | 'speed' | 'subtitles';

interface SettingsBoxProps {
    isOpen: boolean;
    onClose: () => void;
    versions: MovieVersionDTO[];
    activeVersion: MovieVersionDTO | null;
    onChangeResolution: (v: MovieVersionDTO) => void;
    playbackSpeed: number;
    onChangeSpeed: (s: number) => void;
}

export function SettingsBox({
    isOpen,
    onClose,
    versions,
    activeVersion,
    onChangeResolution,
    playbackSpeed,
    onChangeSpeed,
}: SettingsBoxProps) {
    const [[menu, direction], setMenu] = useState<[MenuState, number]>(['main', 0]);

    useEffect(() => {
        if (!isOpen) setTimeout(() => setMenu(['main', 0]), 10);
    }, [isOpen]);

    if (!isOpen) return null;

    const setStep = (newMenu: MenuState, newDirection: number) => {
        setMenu([newMenu, newDirection]);
    };

    const handleClose = () => {
        onClose();
    };

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -50 : 50,
            opacity: 0,
        }),
    };

    return (
        <>
            <div className="fixed inset-0 -z-10" onClick={handleClose} />

            <motion.div
                layout
                layoutDependency={menu}
                transition={{
                    layout: { duration: 0.2, ease: 'easeOut' },
                }}
                className="absolute bottom-full right-0 mb-4 w-64 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden origin-bottom-right"
            >
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    <motion.div
                        key={menu}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                    >
                        {menu === 'main' && (
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold p-3">Settings</p>
                                <MenuButton
                                    icon={<Layers size={16} />}
                                    label="Quality"
                                    value={activeVersion ? getQualityLabel(activeVersion.width ?? 0, activeVersion.height) : 'Auto'}
                                    onClick={() => setStep('quality', 1)}
                                />
                                <MenuButton
                                    icon={<Gauge size={16} />}
                                    label="Playback Speed"
                                    value={`${playbackSpeed}x`}
                                    onClick={() => setStep('speed', 1)}
                                />
                                <MenuButton
                                    icon={<Subtitles size={16} />}
                                    label="Subtitles"
                                    value="Off"
                                    onClick={() => setStep('subtitles', 1)}
                                />
                            </div>
                        )}

                        {menu === 'quality' && (
                            <div>
                                <MenuHeader label="Select Quality" onBack={() => setStep('main', -1)} />
                                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                                    {versions.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                onChangeResolution(v);
                                                handleClose();
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-xl text-[12px] transition-all ${
                                                activeVersion?.id === v.id
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'hover:bg-white/5 text-white/70 border border-transparent'
                                            }`}
                                        >
                                            <span className="font-bold">{getQualityLabel(v.width ?? 0, v.height)}</span>
                                            <div className="flex items-center gap-2">
                                                {activeVersion?.id === v.id && <Check size={14} />}
                                                {v.fileSize && (
                                                    <span className="text-[9px] opacity-30 uppercase">{formatBytes(v.fileSize)}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {menu === 'speed' && (
                            <div>
                                <MenuHeader label="Playback Speed" onBack={() => setStep('main', -1)} />
                                <div className="flex flex-col gap-1">
                                    {speeds.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                onChangeSpeed(s);
                                                handleClose();
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-xl text-[12px] transition-all ${
                                                playbackSpeed === s
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'hover:bg-white/5 text-white/70 border border-transparent'
                                            }`}
                                        >
                                            <span>{s === 1 ? 'Normal' : `${s}x`}</span>
                                            {playbackSpeed === s && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {menu === 'subtitles' && (
                            <div>
                                <MenuHeader label="Subtitles" onBack={() => setStep('main', -1)} />
                                <div className="p-8 text-center text-white/20 text-xs italic">No subtitles available</div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </>
    );
}

function MenuButton({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-3 cursor-pointer rounded-xl hover:bg-white/5 text-white/80 transition-all group/settings"
        >
            <div className="flex items-center gap-3">
                <span className="text-white/40 group-hover/settings:text-primary transition-colors">{icon}</span>
                <span className="text-[13px] font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/30">{value}</span>
                <ChevronRight size={14} className="text-white/20" />
            </div>
        </button>
    );
}

function MenuHeader({ label, onBack }: { label: string; onBack: () => void }) {
    return (
        <div className="flex items-center gap-2 border-b border-white/5 mb-2 pb-1 px-1">
            <button
                onClick={onBack}
                className="p-2 cursor-pointer hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
            >
                <ChevronLeft size={18} />
            </button>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold py-3">{label}</p>
        </div>
    );
}
