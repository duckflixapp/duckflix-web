import { useEffect, useMemo, useRef, useState } from 'react';
import {
    X,
    Film,
    Subtitles,
    Settings,
    Trash2,
    Plus,
    Loader2,
    Upload,
    Search,
    CheckCheck,
    Download,
    Ear,
    BadgeCheck,
    Bot,
} from 'lucide-react';
import type { SubtitleDTO, SubtitleSearchResultDTO, VideoVersionDTO } from '@duckflixapp/shared';
import { formatBytes, getMimeExtension } from '../../utils/format';
import { useVideoVersions } from '../../hooks/useVideoVersions';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideo } from '../../hooks/useVideo';
import ISO6391 from 'iso-639-1';
import { useSubtitles } from '../../hooks/useSubtitles';
import { ModalTemplate, type SettingsTab, type Tab } from './ModalTemplate';

const TABS = [
    { id: 'versions' as const, label: 'Versions', icon: Film },
    { id: 'subtitles' as const, label: 'Subtitles', icon: Subtitles },
];
const PRESET_HEIGHTS = [480, 720, 1080, 1440, 2160];

interface Props {
    videoId: string;
    title: string;
    onClose?: () => void;
    onDelete?: () => void;
    initialTab?: SettingsTab;
    detailsTab?: React.ReactNode;
    deleteLabel?: string;
}

export function VideoSettingsModal({ videoId, onDelete, initialTab, detailsTab, ...props }: Props) {
    const { video, deleteVideo, isDeletingVideo: isDeleting } = useVideo(videoId);
    const { versions, isLoadingVersions, addVersion, deleteVersion } = useVideoVersions(videoId);
    const { upload: uploadSubtitle, delete: deleteSubtitle, search: searchSubtitle, import: importSubtitle } = useSubtitles(videoId);

    const tabs = [detailsTab && { id: 'details' as const, label: 'Details', icon: Settings }, ...TABS].filter((t) => !!t) satisfies Tab[];
    const [tab, setTab] = useState<SettingsTab>(initialTab ?? 'details');

    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    const existingHeights = new Set(
        versions
            .filter((v) => v.mimeType === 'application/x-mpegURL' && v.status !== 'canceled' && v.status !== 'error')
            .map((v) => v.height)
    );
    const original = versions.find((v) => v.isOriginal);
    const availablePresets = PRESET_HEIGHTS.filter((h) => h <= (original?.height ?? 0) && !existingHeights.has(h));

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteVideo(undefined, { onSuccess: onDelete });
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

    if (!video) return;

    return (
        <ModalTemplate {...props} tabs={tabs} tab={tab} setTab={setTab} onDelete={handleDelete} isDeleting={isDeleting}>
            <>
                {tab === 'versions' && (
                    <VersionsTab
                        versions={versions}
                        isLoading={isLoadingVersions}
                        availablePresets={availablePresets}
                        onAdd={addVersion}
                        onDelete={deleteVersion}
                    />
                )}
                {tab === 'subtitles' && (
                    <SubtitlesTab
                        subtitles={video.subtitles}
                        onDelete={deleteSubtitle}
                        onUpload={uploadSubtitle}
                        onSearch={searchSubtitle}
                        onAddFromSearch={importSubtitle}
                    />
                )}
                {tab === 'details' && detailsTab}
            </>
        </ModalTemplate>
    );
}

function VersionsTab({
    versions,
    isLoading,
    availablePresets,
    onAdd,
    onDelete,
}: {
    versions: VideoVersionDTO[];
    isLoading: boolean;
    availablePresets: number[];
    onAdd: (height: number, config: { onSettled: () => void }) => void;
    onDelete: (versionId: string, config: { onSettled: () => void }) => void;
}) {
    const [addingHeight, setAddingHeight] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = (h: number) => {
        setAddingHeight(h);
        onAdd(h, { onSettled: () => setAddingHeight(null) });
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        onDelete(id, { onSettled: () => setDeletingId(null) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-white font-bold text-lg">Versions</h2>
                <p className="text-white/40 text-xs mt-1">Manage versions of this video.</p>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Existing</p>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-white/20" size={24} />
                    </div>
                ) : versions.length === 0 ? (
                    <p className="text-white/20 text-sm italic py-4">No versions found</p>
                ) : (
                    versions.map((v) => (
                        <div
                            key={v.id}
                            className="flex items-center justify-between h-11 px-5 py-2 bg-white/3 border border-white/6 rounded-3xl group hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white/70">{v.height}p</span>
                                <span
                                    className={`text-[9px] px-2 py-0.5 rounded-xl uppercase font-bold tracking-wider ${
                                        v.status === 'ready'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : v.status === 'processing'
                                              ? 'bg-primary/10 text-primary border border-primary/20'
                                              : 'bg-white/5 text-white/30 border border-white/10'
                                    }`}
                                >
                                    {v.status}
                                </span>
                                {v.isOriginal && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-xl uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        Original
                                    </span>
                                )}
                            </div>
                            <div className="relative flex items-center gap-3 overflow-hidden">
                                <span className="text-[10px] text-white/20">{v.mimeType ? getMimeExtension(v.mimeType) : '—'}</span>
                                <span className="text-[10px] text-white/20">{v.fileSize ? formatBytes(v.fileSize, 0) : '—'}</span>
                                {!v.isOriginal && (
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        disabled={deletingId === v.id}
                                        className="p-2 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all cursor-pointer md:opacity-0 group-hover:opacity-100 sm:-mr-9.5 group-hover:mr-0"
                                    >
                                        {deletingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {availablePresets.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Add Version</p>
                    <div className="flex flex-wrap gap-2">
                        {availablePresets.map((h) => (
                            <button
                                key={h}
                                onClick={() => handleAdd(h)}
                                disabled={addingHeight === h}
                                className="flex items-center gap-1 px-4 py-2 bg-white/3 border border-white/7 rounded-4xl text-xs font-bold text-white/60 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {addingHeight === h ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                {h}p
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export const ALL_LANGUAGES = ISO6391.getAllCodes()
    .map((code) => ({ code, name: ISO6391.getName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));

function SubtitlesTab({
    subtitles,
    onDelete,
    onUpload,
    onSearch,
    onAddFromSearch,
}: {
    subtitles: SubtitleDTO[];
    onDelete?: (subtitleId: string, config: { onSettled: () => void }) => void;
    onUpload?: (data: { file: File; language: string }, config: { onSettled: () => void }) => void;
    onSearch?: (language: string) => Promise<SubtitleSearchResultDTO[]>;
    onAddFromSearch?: (data: { fileId: number }, config: { onSettled: () => void }) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [langQuery, setLangQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SubtitleSearchResultDTO[] | null>(null);
    const [addingId, setAddingId] = useState<number | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadLangQuery, setUploadLangQuery] = useState('');
    const [showUploadLangSuggestions, setShowUploadLangSuggestions] = useState(false);
    const [selectedUploadLang, setSelectedUploadLang] = useState<{ code: string; name: string } | null>(null);

    const importedFileIds = useMemo(() => new Set(subtitles.map((s) => s.externalId).filter(Boolean)), [subtitles]);

    const filteredLangs = useMemo(() => {
        if (!langQuery.trim()) return [];
        const q = langQuery.toLowerCase();
        return ALL_LANGUAGES.filter((l) => l.name.toLowerCase().startsWith(q)).slice(0, 6);
    }, [langQuery]);

    const handleDelete = (id: string) => {
        if (!onDelete) return;
        setDeletingId(id);
        onDelete(id, { onSettled: () => setDeletingId(null) });
    };

    const filteredUploadLangs = useMemo(() => {
        if (!uploadLangQuery.trim()) return [];
        const q = uploadLangQuery.toLowerCase();
        return ALL_LANGUAGES.filter((l) => l.name.toLowerCase().startsWith(q)).slice(0, 6);
    }, [uploadLangQuery]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setUploadLangQuery('');
        setSelectedUploadLang(null);
        e.target.value = '';
    };

    const handleConfirmUpload = () => {
        if (!pendingFile || !selectedUploadLang || !onUpload) return;
        setUploadingFile(true);
        onUpload(
            { file: pendingFile, language: selectedUploadLang.code },
            {
                onSettled: () => {
                    setUploadingFile(false);
                    setPendingFile(null);
                },
            }
        );
    };

    const handleSelectLang = async (lang: { code: string; name: string }) => {
        setLangQuery(lang.name);
        setShowSuggestions(false);
        if (!onSearch) return;
        setIsSearching(true);
        setSearchResults(null);
        try {
            const results = await onSearch(lang.code);
            setSearchResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddFromSearch = (result: SubtitleSearchResultDTO) => {
        if (!onAddFromSearch) return;
        setAddingId(result.fileId);
        onAddFromSearch({ fileId: result.fileId }, { onSettled: () => setAddingId(null) });
    };

    return (
        <div className="space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-white font-bold text-lg">Subtitles</h2>
                    <p className="text-white/40 text-xs mt-1">Manage subtitles for this video.</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 mr-8">
                    <input ref={fileInputRef} type="file" accept=".srt,.vtt,.ass,.ssa,.sub" className="hidden" onChange={handleUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || !onUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/3 border border-white/7 rounded-3xl text-[11px] font-semibold text-white/50 hover:text-white/80 hover:border-white/15 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
                    >
                        {uploadingFile ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                        Upload
                    </button>
                    <AnimatePresence>
                        {pendingFile && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="p-4 bg-white/3 border border-white/8 rounded-3xl space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50 truncate">{pendingFile.name}</span>
                                    <button
                                        onClick={() => setPendingFile(null)}
                                        className="text-white hover:text-white transition-all cursor-pointer ml-2"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>

                                <div className="relative">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2 bg-white/3 border transition-all ${
                                            showUploadLangSuggestions && filteredUploadLangs.length > 0
                                                ? 'border-white/15 rounded-t-2xl rounded-b-none'
                                                : 'border-white/6 rounded-2xl focus-within:border-white/15'
                                        }`}
                                    >
                                        <input
                                            type="text"
                                            value={uploadLangQuery}
                                            onChange={(e) => {
                                                setUploadLangQuery(e.target.value);
                                                setShowUploadLangSuggestions(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && filteredUploadLangs[0]) {
                                                    setSelectedUploadLang(filteredUploadLangs[0]);
                                                    setUploadLangQuery(filteredUploadLangs[0].name);
                                                    setShowUploadLangSuggestions(false);
                                                }
                                            }}
                                            onFocus={() => setShowUploadLangSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowUploadLangSuggestions(false), 150)}
                                            placeholder="Select language…"
                                            className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {showUploadLangSuggestions && filteredUploadLangs.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-2xl overflow-hidden z-10"
                                            >
                                                {filteredUploadLangs.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onMouseDown={() => {
                                                            setSelectedUploadLang(lang);
                                                            setUploadLangQuery(lang.name);
                                                            setShowUploadLangSuggestions(false);
                                                        }}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-left"
                                                    >
                                                        <span>{lang.name}</span>
                                                        <span className="text-[10px] text-white/20 uppercase">{lang.code}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={handleConfirmUpload}
                                    disabled={!selectedUploadLang || uploadingFile}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl text-xs font-semibold text-primary hover:bg-primary/15 transition-all cursor-pointer disabled:opacity-40"
                                >
                                    {uploadingFile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                    Upload
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* existing */}
            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Existing</p>
                {subtitles.length === 0 ? (
                    <p className="text-white/20 text-sm italic py-4">No subtitles available</p>
                ) : (
                    subtitles.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center justify-between h-11 px-5 py-2 bg-white/3 border border-white/6 rounded-3xl group hover:border-white/10 transition-all"
                        >
                            <span className="text-xs font-bold text-white/70">{s.name}</span>
                            <div className="relative flex items-center gap-3 overflow-hidden">
                                <span className="text-[10px] text-white/20 uppercase tracking-wider">{s.language}</span>
                                {onDelete && (
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        disabled={deletingId === s.id}
                                        className="p-2 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100 -mr-9.5 group-hover:mr-0"
                                    >
                                        {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* search by language */}
            {onSearch && (
                <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Search OpenSubtitles</p>

                    <div className="relative">
                        <div
                            className={`flex items-center gap-2 px-4 py-2 bg-white/3 border transition-all ${
                                showSuggestions && filteredLangs.length > 0
                                    ? 'border-white/15 rounded-t-3xl rounded-b-none'
                                    : 'border-white/6 rounded-3xl focus-within:border-white/15'
                            }`}
                        >
                            {isSearching ? (
                                <Loader2 size={13} className="text-white/20 shrink-0 animate-spin" />
                            ) : (
                                <Search size={13} className="text-white/20 shrink-0" />
                            )}
                            <input
                                type="text"
                                value={langQuery}
                                onChange={(e) => {
                                    setLangQuery(e.target.value);
                                    setShowSuggestions(true);
                                    if (!e.target.value) {
                                        setSearchResults(null);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSelectLang(filteredLangs[0] ?? null);
                                    }
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                placeholder="Type a language…"
                                className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                            />
                        </div>

                        {/* suggestions dropdown */}
                        <AnimatePresence>
                            {showSuggestions && filteredLangs.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-2xl overflow-hidden z-10"
                                >
                                    {filteredLangs.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onMouseDown={() => handleSelectLang(lang)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-left"
                                        >
                                            <span>{lang.name}</span>
                                            <span className="text-[10px] text-white/20 uppercase">{lang.code}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* results */}
                    <AnimatePresence>
                        {searchResults !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                {searchResults.length === 0 ? (
                                    <p className="text-white/20 text-xs italic py-2">No results for this language</p>
                                ) : (
                                    searchResults.map((r) => {
                                        const isImported = importedFileIds.has(String(r.fileId));
                                        return (
                                            <div
                                                key={r.fileId}
                                                className="flex items-center justify-between h-11 px-5 py-2 bg-white/3 border border-white/6 rounded-3xl hover:border-white/10 transition-all"
                                            >
                                                <span className="text-xs text-white/60 truncate min-w-0 pr-4">{r.release}</span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {r.aiTranslated && (
                                                        <div className="p-1.5 rounded-full text-red-400" title={'AI Translated'}>
                                                            <Bot size={14} />
                                                        </div>
                                                    )}
                                                    {r.hearingImpaired && (
                                                        <div className="p-1.5 rounded-full" title={'Hearing Impaired'}>
                                                            <Ear size={14} />
                                                        </div>
                                                    )}
                                                    {r.trusted && (
                                                        <div className="p-1.5 rounded-full text-primary" title={'Trusted Source'}>
                                                            <BadgeCheck size={14} />
                                                        </div>
                                                    )}
                                                    <div
                                                        className="flex items-center gap-2 text-white/40"
                                                        title={r.downloads + ' Downloads'}
                                                    >
                                                        <span className="text-[9px]">{r.downloads.toLocaleString()}</span>
                                                    </div>
                                                    {isImported ? (
                                                        <div className="p-1.5 rounded-full text-primary" title={'Downloaded'}>
                                                            <CheckCheck size={14} />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            title={'Download'}
                                                            onClick={() => handleAddFromSearch(r)}
                                                            disabled={addingId === r.fileId}
                                                            className="p-1.5 rounded-full hover:bg-primary/10 text-white/30 hover:text-primary border border-transparent hover:border-primary/20 transition-all cursor-pointer disabled:opacity-40"
                                                        >
                                                            {addingId === r.fileId ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <Download size={14} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
