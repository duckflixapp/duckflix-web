import type { MovieDetailedDTO } from '@duckflix/shared';
import { ChevronLeft, Loader2, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useMovieDetailed } from '../../hooks/useMovieDetailed';

export function MovieError({ movie }: { movie: MovieDetailedDTO }) {
    const navigate = useNavigate();
    const auth = useAuthContext();
    const { deleteMovie, isDeletingMovie } = useMovieDetailed(movie.id);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!confirmDelete) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (deleteButtonRef.current?.contains(e.target as Node)) return;
            setConfirmDelete(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [confirmDelete]);

    return (
        <div className="min-h-screen relative pb-16 flex flex-col items-center justify-center gap-6 text-center px-8">
            {/* center */}
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                <X size={32} className="text-red-400" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-black text-white">{movie.title}</h1>
                <p className="text-white/40 text-sm">This movie encountered an error and cannot be played.</p>
                <span className="inline-block mt-2 text-[10px] px-3 py-1 rounded-2xl uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                    {movie.status}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/browse')}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-3xl transition-all cursor-pointer"
                >
                    <ChevronLeft size={16} />
                    Back to Browse
                </button>
                {auth?.hasRole('contributor') && (
                    <button
                        ref={deleteButtonRef}
                        onClick={() => {
                            if (!confirmDelete) {
                                setConfirmDelete(true);
                                return;
                            }
                            deleteMovie(undefined, { onSuccess: () => navigate('/browse') });
                        }}
                        disabled={isDeletingMovie}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-3xl transition-all cursor-pointer border ${
                            confirmDelete
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-white/5 hover:bg-red-500/10 border-white/10 text-red-400 hover:border-red-500/30'
                        }`}
                    >
                        {isDeletingMovie ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        {confirmDelete ? 'Confirm Delete' : 'Delete Movie'}
                    </button>
                )}
            </div>
        </div>
    );
}
