import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { CardSkeleton } from '../components/movies/MovieCard';
import { Library, ArrowLeft, Loader2, ClockFading, Plus, Trash2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import CreateLibraryModal from '../components/library/CreateLibraryModal';
import { ContentCard } from '../components/search/ContentCard';

export default function LibraryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();

    const selectedLibId = searchParams.get('id');
    const {
        libraries: librariesQuery,
        libraryItems,
        libraryDetails,
        createLibrary,
        deleteLibrary,
    } = useLibrary(selectedLibId ?? undefined);

    const { ref, inView } = useInView();

    const content = libraryItems.data?.pages.flatMap((page) => page.data) ?? [];
    const libraries = librariesQuery.data?.libraries ?? [];

    useEffect(() => {
        if (inView && libraryItems.hasNextPage && !libraryItems.isFetchingNextPage) {
            libraryItems.fetchNextPage();
        }
    }, [inView, libraryItems]);

    const selectLibrary = (id: string | null) => {
        if (id) setSearchParams({ id });
        else setSearchParams({});
    };

    const handleCreate = (name: string) => {
        createLibrary(name, { onSuccess: () => setShowCreate(false) });
    };

    if (!selectedLibId) {
        return (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <header className="mb-12">
                    <h1 className="text-3xl font-black tracking-tight text-white">My Collections</h1>
                    <p className="text-text/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Organize your movies</p>
                </header>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                    {librariesQuery.isLoading
                        ? Array(4)
                              .fill(0)
                              .map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />)
                        : libraries.map((lib) => (
                              <div key={lib.id} className="relative group/lib">
                                  <button
                                      onClick={() => selectLibrary(lib.id)}
                                      className="w-full group cursor-pointer bg-white/5 border border-white/10 rounded-4xl p-8 flex flex-col items-start transition-all hover:bg-white/10 hover:border-primary/50 text-left"
                                  >
                                      <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-6 group-hover:scale-110 transition-transform">
                                          {lib.type === 'watchlist' ? <ClockFading size={24} /> : <Library size={24} />}
                                      </div>
                                      <h3 className="text-lg font-bold text-white truncate w-full">{lib.name}</h3>
                                      <p className="text-text/40 text-[10px] font-black uppercase tracking-widest mt-1">{lib.size} Items</p>
                                  </button>
                                  {lib.type === 'custom' && <DeleteLibraryButton onDelete={() => deleteLibrary(lib.id)} />}
                              </div>
                          ))}

                    {!librariesQuery.isLoading && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="group cursor-pointer bg-white/3 border border-dashed border-white/10 rounded-4xl p-8 flex flex-col items-start transition-all hover:bg-white/5 hover:border-primary/30 text-left"
                        >
                            <div className="p-4 bg-white/5 rounded-2xl text-white/30 mb-6 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white/30 group-hover:text-white transition-colors">New Collection</h3>
                            <p className="text-text/20 text-[10px] font-black uppercase tracking-widest mt-1">Create playlist</p>
                        </button>
                    )}
                </div>
                {showCreate && <CreateLibraryModal onCreate={handleCreate} onClose={() => setShowCreate(false)} />}
            </div>
        );
    }

    const totalItems = libraryItems.data?.pages[0]?.meta.totalItems ?? 0;
    const libType = libraryDetails.data?.library.type;
    const isInitialLoading = libraryItems.isLoading;

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="flex items-center gap-4 mb-10">
                <button
                    onClick={() => selectLibrary(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-white transition-all cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h1
                            className="text-2xl font-black text-white truncate max-w-75 md:max-w-125"
                            title={libraryDetails.data?.library.name}
                        >
                            {libraryDetails.data?.library.name}
                        </h1>
                        {libraryItems.isFetching && <Loader2 size={20} className="animate-spin text-primary" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text/40">
                            {totalItems} Movie{totalItems !== 1 && 's'} found
                        </span>
                    </div>
                </div>
            </div>

            {!isInitialLoading && content.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-6 bg-white/5 rounded-full mb-6">
                        {libType === 'watchlist' ? (
                            <ClockFading size={48} className="text-primary/50" />
                        ) : (
                            <Library size={48} className="text-primary/50" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {libType === 'watchlist' ? 'Your watchlist is empty' : 'No movies here yet'}
                    </h2>
                    <p className="text-text/40 text-sm text-center max-w-xs uppercase tracking-widest font-medium">
                        {libType === 'watchlist' ? 'You need to start watching!' : 'Add some movies to this collection to see them here.'}
                    </p>
                    <button
                        onClick={() => navigate('/browse')}
                        className="mt-8 px-6 py-3 bg-primary text-background font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all cursor-pointer"
                    >
                        Browse
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                    {content.map(({ id, content }) => (
                        <ContentCard key={id} content={content} onClick={() => navigate(`/details/${content.type}/${content.id}`)} />
                    ))}

                    {(isInitialLoading || libraryItems.isFetchingNextPage) &&
                        Array(6)
                            .fill(0)
                            .map((_, i) => <CardSkeleton key={`skeleton-${i}`} />)}
                </div>
            )}

            <div ref={ref} className="h-20 w-full flex items-center justify-center mt-8">
                {libraryItems.isFetchingNextPage && (
                    <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading more content...</p>
                )}
                {!libraryItems.hasNextPage && content.length > 0 && (
                    <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.3em]">
                        End of {libraryDetails.data?.library.name}
                    </p>
                )}
            </div>
        </div>
    );
}

function DeleteLibraryButton({ onDelete }: { onDelete: () => void }) {
    const [confirm, setConfirm] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!confirm) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setConfirm(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [confirm]);

    return (
        <button
            ref={ref}
            onClick={(e) => {
                e.stopPropagation();
                if (!confirm) {
                    setConfirm(true);
                    return;
                }
                onDelete();
            }}
            className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer opacity-0 group-hover/lib:opacity-100 text-xs font-bold ${
                confirm ? 'bg-red-500/20 text-red-400 px-3' : 'hover:bg-red-500/10 text-white/20 hover:text-red-400'
            }`}
        >
            {confirm ? 'Delete?' : <Trash2 size={16} />}
        </button>
    );
}
