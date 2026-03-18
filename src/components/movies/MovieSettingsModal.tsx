import { useEffect, useRef, useState } from 'react';
import { X, Film, Subtitles, Settings, Trash2, Plus, Loader2 } from 'lucide-react';
import type { MovieDetailedDTO, MovieVersionDTO, SubtitleDTO } from '@duckflix/shared';
import { formatBytes, getMimeExtension } from '../../utils/format';
import { useMovieVersions } from '../../hooks/useMovieVersions';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { MovieUpdateFormValues } from '../../schemas/movie';
import { appendSubtitleName } from '../../utils/subtitles';

export type SettingsTab = 'versions' | 'subtitles' | 'details';

const PRESET_HEIGHTS = [480, 720, 1080, 1440, 2160];

const tabs = [
    { id: 'details', label: 'Details', icon: Settings },
    { id: 'versions', label: 'Versions', icon: Film },
    { id: 'subtitles', label: 'Subtitles', icon: Subtitles },
] as const;

interface Props {
    movie: MovieDetailedDTO;
    onClose: () => void;
    onMovieDeleted: () => void;
    updateMovie: (data: MovieUpdateFormValues) => void;
    isUpdating: boolean;
    initialTab?: SettingsTab;
}

export function MovieSettingsModal({ movie, onClose, onMovieDeleted, updateMovie, isUpdating, initialTab }: Props) {
    const [tab, setTab] = useState<SettingsTab>(initialTab ?? 'details');

    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    const { versions, isLoadingVersions, addVersion, deleteVersion, deleteMovie, isDeletingMovie } = useMovieVersions(movie.id);

    const existingHeights = new Set(
        versions
            .filter((v) => v.mimeType === 'application/x-mpegURL' && v.status !== 'canceled' && v.status !== 'error')
            .map((v) => v.height)
    );
    const original = versions.find((v) => v.isOriginal);
    const availablePresets = PRESET_HEIGHTS.filter((h) => h <= (original?.height ?? 0) && !existingHeights.has(h));

    const handleDeleteMovie = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteMovie(undefined, { onSuccess: onMovieDeleted });
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-90 flex items-center justify-center p-4 md:p-8"
                onClick={onClose}
            >
                {/* backdrop */}
                <div className="absolute inset-0 bg-black/75" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-5xl max-h-[70vh] h-full bg-background/55 backdrop-blur-3xl border border-white/10 rounded-4xl overflow-hidden flex shadow-2xl"
                >
                    {/* sidebar */}
                    <div className="w-56 shrink-0 border-r border-white/5 p-4 flex flex-col gap-1">
                        <div className="px-3 py-4 mb-2">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Movie Settings</p>
                            <p className="text-white font-semibold text-sm mt-1 truncate">{movie.title}</p>
                        </div>

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
                                {label}
                            </button>
                        ))}

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <button
                                ref={deleteButtonRef}
                                onClick={handleDeleteMovie}
                                disabled={isDeletingMovie}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-3xl text-sm transition-all cursor-pointer ${
                                    confirmDelete
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                            >
                                {isDeletingMovie ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                {confirmDelete ? 'Confirm Delete' : 'Delete Movie'}
                            </button>
                        </div>
                    </div>

                    {/* content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
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
                                {tab === 'versions' && (
                                    <VersionsTab
                                        versions={versions}
                                        isLoading={isLoadingVersions}
                                        availablePresets={availablePresets}
                                        onAdd={addVersion}
                                        onDelete={deleteVersion}
                                    />
                                )}
                                {tab === 'subtitles' && <SubtitlesTab subtitles={movie.subtitles} movieId={movie.id} />}
                                {tab === 'details' && <DetailsTab movie={movie} onUpdate={updateMovie} isUpdating={isUpdating} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

function VersionsTab({
    versions,
    isLoading,
    availablePresets,
    onAdd,
    onDelete,
}: {
    versions: MovieVersionDTO[];
    isLoading: boolean;
    availablePresets: number[];
    onAdd: (height: number, config: { onSettled: () => void }) => void;
    onDelete: (versionId: string, config: { onSettled: () => void }) => void;
}) {
    const [addingHeight, setAddingHeight] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = (h: number) => {
        setAddingHeight(h);
        onAdd(h, {
            onSettled: () => setAddingHeight(null),
        });
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        onDelete(id, {
            onSettled: () => setDeletingId(null),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-white font-bold text-lg">Versions</h2>
                <p className="text-white/40 text-xs mt-1">Manage versions of this video.</p>
            </div>

            {/* existing versions */}
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
                                        className="p-2 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100 -mr-9.5 group-hover:mr-0"
                                    >
                                        {deletingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* add version */}
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
function DetailsTab({
    movie,
    onUpdate,
    isUpdating,
}: {
    movie: MovieDetailedDTO;
    onUpdate: (data: MovieUpdateFormValues) => void;
    isUpdating: boolean;
}) {
    const [form, setForm] = useState({
        title: movie.title ?? '',
        overview: movie.description ?? '',
        releaseYear: movie.releaseYear?.toString() ?? '',
        bannerUrl: movie.bannerUrl ?? '',
        posterUrl: movie.posterUrl ?? '',
    });

    const isDirty =
        form.title !== (movie.title ?? '') ||
        form.overview !== (movie.description ?? '') ||
        form.releaseYear !== (movie.releaseYear?.toString() ?? '') ||
        form.bannerUrl !== (movie.bannerUrl ?? '') ||
        form.posterUrl !== (movie.posterUrl ?? '');

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        onUpdate({
            title: form.title || undefined,
            overview: form.overview || null,
            releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
            bannerUrl: form.bannerUrl || null,
            posterUrl: form.posterUrl || null,
        });
    };

    const inputClass =
        'w-full bg-white/3 border border-white/6 rounded-3xl px-4 py-3 text-xs text-text/75 outline-none transition-all focus:border-primary/50 placeholder:text-white/20';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-white font-bold text-lg">Details</h2>
                <p className="text-white/40 text-xs mt-1">Edit movie metadata.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Title</label>
                        <input
                            className={inputClass}
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="Movie title"
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Overview</label>
                        <textarea
                            className={`${inputClass} resize-none h-24`}
                            value={form.overview}
                            onChange={(e) => setForm((p) => ({ ...p, overview: e.target.value }))}
                            placeholder="Movie overview"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Release Year</label>
                        <input
                            className={inputClass}
                            type="number"
                            value={form.releaseYear}
                            onChange={(e) => setForm((p) => ({ ...p, releaseYear: e.target.value }))}
                            placeholder="2024"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Banner URL</label>
                        <input
                            className={inputClass}
                            value={form.bannerUrl}
                            onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Poster URL</label>
                        <input
                            className={inputClass}
                            value={form.posterUrl}
                            onChange={(e) => setForm((p) => ({ ...p, posterUrl: e.target.value }))}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isUpdating || !isDirty}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/80 text-background text-sm font-medium rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isUpdating && <Loader2 size={14} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

function SubtitlesTab({ subtitles: _subtitles }: { subtitles: SubtitleDTO[]; movieId: string }) {
    const subtitles = appendSubtitleName(_subtitles);
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-white font-bold text-lg">Subtitles</h2>
                <p className="text-white/40 text-xs mt-1">Manage subtitles for this movie.</p>
            </div>
            {subtitles.length === 0 ? (
                <p className="text-white/20 text-sm italic py-4">No subtitles available</p>
            ) : (
                <div className="space-y-2">
                    {subtitles.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/5 rounded-2xl group hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/70">{s.name}</span>
                            </div>
                            <div className="relative flex items-center gap-3 overflow-hidden">
                                <span className="text-[10px] text-white/20">{s.language}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
