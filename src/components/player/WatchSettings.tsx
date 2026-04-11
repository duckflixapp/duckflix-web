import type { VideoVersionDTO, SubtitleDTO } from '@duckflixapp/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { getMimeExtension } from '../../utils/format';
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileUp, Gauge, Layers, RotateCcw, Settings, Subtitles } from 'lucide-react';

type MenuState =
    | 'main'
    | 'quality'
    | 'speed'
    | 'subtitles'
    | 'subtitle-config'
    | 'subtitle-font-family'
    | 'subtitle-font-color'
    | 'subtitle-font-opacity'
    | 'subtitle-font-size'
    | 'subtitle-bg-color'
    | 'subtitle-bg-opacity';

export type SubtitleColor = 'white' | 'black' | 'yellow' | 'cyan' | 'none';

export type SubtitleConfig = {
    fontFamily: 'default' | 'monospace' | 'roboto' | 'arial' | 'helvetica';
    fontColor: SubtitleColor;
    bgColor: SubtitleColor;
    fontOpacity: 25 | 50 | 75 | 100;
    fontSize: 50 | 75 | 100 | 125 | 150;
    bgOpacity: 0 | 25 | 50 | 75 | 100;
};

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
    fontFamily: 'default',
    fontColor: 'white',
    fontOpacity: 100,
    fontSize: 100,
    bgColor: 'black',
    bgOpacity: 50,
};

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    versions: VideoVersionDTO[];
    activeVersion: VideoVersionDTO | null;
    onChangeResolution: (v: VideoVersionDTO) => void;
    playbackSpeed: number;
    onChangeSpeed: (s: number) => void;
    subtitles: SubtitleDTO[];
    activeSubtitle: SubtitleDTO | null;
    setSubtitle: (s: SubtitleDTO | null) => void;
    onUploadLocal: () => void;
    subtitleConfig: SubtitleConfig;
    onChangeSubtitleConfig: (config: SubtitleConfig) => void;
    subtitleDelay: number;
    onChangeDelay: (v: number) => void;
}

// ─── Reusable option list ────────────────────────────────────────────────────

function OptionList<T extends string | number>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    label?: (v: T) => string;
}) {
    return (
        <div className="flex flex-col gap-1">
            {options.map((opt) => (
                <button
                    key={String(opt.value)}
                    onClick={() => onChange(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl text-[12px] transition-all ${
                        value === opt.value
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'hover:bg-white/5 text-white/70 border border-transparent'
                    }`}
                >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check size={14} />}
                </button>
            ))}
        </div>
    );
}

// ─── Option definitions ──────────────────────────────────────────────────────

const FONT_FAMILIES: { value: SubtitleConfig['fontFamily']; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'arial', label: 'Arial' },
    { value: 'helvetica', label: 'Helvetica' },
    { value: 'monospace', label: 'Monospace' },
];

const FONT_COLORS: { value: SubtitleConfig['fontColor']; label: string }[] = [
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'cyan', label: 'Cyan' },
];

const OPACITIES: { value: SubtitleConfig['fontOpacity']; label: string }[] = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' },
];

const FONT_SIZES: { value: SubtitleConfig['fontSize']; label: string }[] = [
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' },
    { value: 125, label: '125%' },
    { value: 150, label: '150%' },
];

// const BG_COLORS: { value: SubtitleConfig['bgColor']; label: string }[] = [
//     { value: 'black', label: 'Black' },
//     { value: 'white', label: 'White' },
//     { value: 'yellow', label: 'Yellow' },
//     { value: 'cyan', label: 'Cyan' },
//     { value: 'none', label: 'None' },
// ];

// const BG_OPACITIES: { value: SubtitleConfig['bgOpacity']; label: string }[] = [
//     { value: 0, label: '0%' },
//     { value: 25, label: '25%' },
//     { value: 50, label: '50%' },
//     { value: 75, label: '75%' },
//     { value: 100, label: '100%' },
// ];

// ─── Main component ──────────────────────────────────────────────────────────

export function SettingsBox({
    isOpen,
    onClose,
    versions,
    activeVersion,
    onChangeResolution,
    playbackSpeed,
    onChangeSpeed,
    subtitles,
    setSubtitle,
    activeSubtitle: _activeSubtitle,
    onUploadLocal,
    subtitleConfig,
    onChangeSubtitleConfig,
    subtitleDelay,
    onChangeDelay,
}: SettingsProps) {
    const [[menu, direction], setMenu] = useState<[MenuState, number]>(['main', 0]);

    const activeSubtitle = subtitles.find((s) => s.id === _activeSubtitle?.id) ?? null;

    useEffect(() => {
        if (!isOpen) setTimeout(() => setMenu(['main', 0]), 10);
    }, [isOpen]);

    if (!isOpen) return null;

    const setStep = (newMenu: MenuState, newDirection: number) => setMenu([newMenu, newDirection]);

    const set = <K extends keyof SubtitleConfig>(key: K, value: SubtitleConfig[K]) =>
        onChangeSubtitleConfig({ ...subtitleConfig, [key]: value });

    const resetConfig = () => onChangeSubtitleConfig(DEFAULT_SUBTITLE_CONFIG);

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
    };

    return (
        <>
            <div className="fixed inset-0 -z-10" onClick={onClose} />

            <motion.div
                layout
                layoutDependency={menu}
                transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
                className="absolute bottom-full right-0 mb-4 w-64 bg-background/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl overflow-hidden origin-bottom-right"
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
                        {/* ── MAIN ── */}
                        {menu === 'main' && (
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold p-3 pb-2">Settings</p>
                                <MenuButton
                                    icon={<Layers size={16} />}
                                    label="Quality"
                                    value={activeVersion?.height ? activeVersion.height + 'p' : 'Auto'}
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
                                    value={activeSubtitle ? activeSubtitle.name : 'Off'}
                                    onClick={() => setStep('subtitles', 1)}
                                />
                            </div>
                        )}

                        {/* ── QUALITY ── */}
                        {menu === 'quality' && (
                            <div>
                                <MenuHeader label="Select Quality" onBack={() => setStep('main', -1)} />
                                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                                    {versions.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                onChangeResolution(v);
                                                setStep('main', -1);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl text-[12px] transition-all ${
                                                activeVersion?.id === v.id
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'hover:bg-white/5 text-white/70 border border-transparent'
                                            }`}
                                        >
                                            <span className="font-bold">{v.height ? v.height + 'p' : 'Auto'}</span>
                                            <div className="flex items-center gap-2">
                                                {activeVersion?.id === v.id && <Check size={14} />}
                                                {v.height && (
                                                    <>
                                                        {v.streamUrl.includes('/live/') && (
                                                            <span className="text-[9px] opacity-30 uppercase">live</span>
                                                        )}
                                                        {v.mimeType && (
                                                            <span className="text-[9px] opacity-30 uppercase">
                                                                {getMimeExtension(v.mimeType)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── SPEED ── */}
                        {menu === 'speed' && (
                            <div>
                                <MenuHeader label="Playback Speed" onBack={() => setStep('main', -1)} />
                                <div className="flex flex-col gap-1">
                                    {speeds.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                onChangeSpeed(s);
                                                setStep('main', -1);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl text-[12px] transition-all ${
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

                        {/* ── SUBTITLES ── */}
                        {menu === 'subtitles' && (
                            <div>
                                <MenuHeader label="Subtitles" onBack={() => setStep('main', -1)}>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setStep('subtitle-config', 1)}
                                            className="p-2 cursor-pointer hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            onClick={onUploadLocal}
                                            className="p-2 cursor-pointer hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                                        >
                                            <FileUp size={17} />
                                        </button>
                                    </div>
                                </MenuHeader>
                                {subtitles.length === 0 ? (
                                    <div className="p-8 text-center text-white/20 text-xs italic">No subtitles available</div>
                                ) : (
                                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                                        <button
                                            onClick={() => {
                                                setStep('main', -1);
                                                setSubtitle(null);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl text-[12px] transition-all ${
                                                activeSubtitle === null
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'hover:bg-white/5 text-white/70 border border-transparent'
                                            }`}
                                        >
                                            <span>Off</span>
                                            {activeSubtitle === null && <Check size={14} />}
                                        </button>
                                        {subtitles.map((subtitle) => (
                                            <button
                                                key={subtitle.id}
                                                onClick={() => {
                                                    setStep('main', -1);
                                                    setSubtitle(subtitle);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-2xl text-[12px] transition-all ${
                                                    subtitle.id === activeSubtitle?.id
                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                        : 'hover:bg-white/5 text-white/70 border border-transparent'
                                                }`}
                                            >
                                                <span>{subtitle.name}</span>
                                                {subtitle.id === activeSubtitle?.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── SUBTITLE CONFIG ── */}
                        {menu === 'subtitle-config' && (
                            <div>
                                <MenuHeader label="Subtitle Style" onBack={() => setStep('subtitles', -1)}>
                                    <button
                                        onClick={resetConfig}
                                        className="p-2 cursor-pointer hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                                        title="Reset to defaults"
                                    >
                                        <RotateCcw size={15} />
                                    </button>
                                </MenuHeader>
                                <div className="flex flex-col gap-1">
                                    <MenuButton
                                        icon={null}
                                        label="Font Family"
                                        value={FONT_FAMILIES.find((f) => f.value === subtitleConfig.fontFamily)?.label ?? 'Default'}
                                        onClick={() => setStep('subtitle-font-family', 1)}
                                    />
                                    <MenuButton
                                        icon={null}
                                        label="Font Color"
                                        value={FONT_COLORS.find((f) => f.value === subtitleConfig.fontColor)?.label ?? 'White'}
                                        onClick={() => setStep('subtitle-font-color', 1)}
                                    />
                                    <MenuButton
                                        icon={null}
                                        label="Font Opacity"
                                        value={`${subtitleConfig.fontOpacity}%`}
                                        onClick={() => setStep('subtitle-font-opacity', 1)}
                                    />
                                    <MenuButton
                                        icon={null}
                                        label="Font Size"
                                        value={`${subtitleConfig.fontSize}%`}
                                        onClick={() => setStep('subtitle-font-size', 1)}
                                    />

                                    {/* Disabled due to browser incompatibility */}
                                    {/* <MenuButton
                                        icon={null}
                                        label="Background Color"
                                        value={BG_COLORS.find((f) => f.value === subtitleConfig.bgColor)?.label ?? 'Black'}
                                        onClick={() => setStep('subtitle-bg-color', 1)}
                                    />
                                    <MenuButton
                                        icon={null}
                                        label="Background Opacity"
                                        value={`${subtitleConfig.bgOpacity}%`}
                                        onClick={() => setStep('subtitle-bg-opacity', 1)}
                                    /> */}

                                    <div className="px-3 py-2 mt-1 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[12px] text-white/60">Delay</span>
                                            <span className="text-[12px] text-white/40 font-mono">
                                                {subtitleDelay > 0 ? '+' : ''}
                                                {subtitleDelay.toFixed(1)}s
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onChangeDelay(Math.round((subtitleDelay - 0.5) * 10) / 10)}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[12px] transition-all cursor-pointer flex-1"
                                            >
                                                -0.5s
                                            </button>
                                            <button
                                                onClick={() => onChangeDelay(Math.round((subtitleDelay + 0.5) * 10) / 10)}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[12px] transition-all cursor-pointer flex-1"
                                            >
                                                +0.5s
                                            </button>
                                        </div>
                                        {subtitleDelay !== 0 && (
                                            <button
                                                onClick={() => onChangeDelay(0)}
                                                className="w-full mt-1.5 text-[11px] text-white/30 hover:text-white/60 transition-all cursor-pointer text-center"
                                            >
                                                Reset delay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SUBTITLE SUB-MENUS ── */}
                        {menu === 'subtitle-font-family' && (
                            <div>
                                <MenuHeader label="Font Family" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList
                                    options={FONT_FAMILIES}
                                    value={subtitleConfig.fontFamily}
                                    onChange={(v) => set('fontFamily', v)}
                                />
                            </div>
                        )}

                        {menu === 'subtitle-font-color' && (
                            <div>
                                <MenuHeader label="Font Color" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList options={FONT_COLORS} value={subtitleConfig.fontColor} onChange={(v) => set('fontColor', v)} />
                            </div>
                        )}

                        {menu === 'subtitle-font-opacity' && (
                            <div>
                                <MenuHeader label="Font Opacity" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList
                                    options={OPACITIES}
                                    value={subtitleConfig.fontOpacity}
                                    onChange={(v) => set('fontOpacity', v as SubtitleConfig['fontOpacity'])}
                                />
                            </div>
                        )}

                        {menu === 'subtitle-font-size' && (
                            <div>
                                <MenuHeader label="Font Size" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList
                                    options={FONT_SIZES}
                                    value={subtitleConfig.fontSize}
                                    onChange={(v) => set('fontSize', v as SubtitleConfig['fontSize'])}
                                />
                            </div>
                        )}

                        {/* {menu === 'subtitle-bg-color' && (
                            <div>
                                <MenuHeader label="Background Color" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList options={BG_COLORS} value={subtitleConfig.bgColor} onChange={(v) => set('bgColor', v)} />
                            </div>
                        )}

                        {menu === 'subtitle-bg-opacity' && (
                            <div>
                                <MenuHeader label="Background Opacity" onBack={() => setStep('subtitle-config', -1)} />
                                <OptionList
                                    options={BG_OPACITIES}
                                    value={subtitleConfig.bgOpacity}
                                    onChange={(v) => set('bgOpacity', v as SubtitleConfig['bgOpacity'])}
                                />
                            </div>
                        )} */}
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
            className="w-full flex items-center justify-between px-3 py-3 cursor-pointer rounded-2xl hover:bg-white/5 text-white/80 transition-all group/settings"
        >
            <div className="flex items-center gap-3">
                {icon && <span className="text-white/40 group-hover/settings:text-primary transition-colors">{icon}</span>}
                <span className="text-[13px] font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/30 text-end truncate line-clamp-1 max-w-20">{value}</span>
                <ChevronRight size={14} className="text-white/20" />
            </div>
        </button>
    );
}

function MenuHeader({ label, onBack, children }: { label: string; onBack: () => void; children?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 mb-2 pb-1 px-1">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-2 cursor-pointer hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold py-3">{label}</p>
            </div>
            {children}
        </div>
    );
}
