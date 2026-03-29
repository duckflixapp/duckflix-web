import type { MovieDetailedDTO } from '@duckflix/shared';
import type { MovieUpdateFormValues } from '../../schemas/movie';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function MovieDetailsTab({
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
        overview: movie.overview ?? '',
        releaseYear: movie.releaseYear?.toString() ?? '',
        bannerUrl: movie.bannerUrl ?? '',
        posterUrl: movie.posterUrl ?? '',
    });

    const isDirty =
        form.title !== (movie.title ?? '') ||
        form.overview !== (movie.overview ?? '') ||
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
            genres: null,
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/80 text-background text-sm font-medium rounded-3xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isUpdating && <Loader2 size={14} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
