import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { MovieCard, MovieCardSkeleton } from '../components/movies/MovieCard';
import { Library, ArrowLeft, Loader2, ClockFading } from 'lucide-react';

export default function LibraryPage() {
    const [selectedLibId, setSelectedLibId] = useState<string | null>(null);
    const { libraries: librariesQuery, libraryMovies, libraryDetails } = useLibrary(selectedLibId ?? undefined);
    const navigate = useNavigate();

    const movies = libraryMovies.data?.pages.flatMap((page) => page.data) ?? [];
    const libraries = librariesQuery.data?.libraries ?? [];

    if (!selectedLibId) {
        return (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <header className="mb-12">
                    <h1 className="text-3xl font-black tracking-tight text-white">My Collections</h1>
                    <p className="text-text/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Organize your movies</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {librariesQuery.isLoading
                        ? Array(4)
                              .fill(0)
                              .map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />)
                        : libraries.map((lib) => (
                              <button
                                  key={lib.id}
                                  onClick={() => setSelectedLibId(lib.id)}
                                  className="group relative cursor-pointer bg-white/5 border border-white/10 rounded-4xl p-8 flex flex-col items-start transition-all hover:bg-white/10 hover:border-primary/50 text-left"
                              >
                                  <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-6 group-hover:scale-110 transition-transform">
                                      {lib.type === 'watchlist' ? <ClockFading size={24} /> : <Library size={24} />}
                                  </div>
                                  <h3 className="text-lg font-bold text-white">{lib.name}</h3>
                                  <p className="text-text/40 text-[10px] font-black uppercase tracking-widest mt-1">{lib.size} Items</p>
                              </button>
                          ))}
                </div>
            </div>
        );
    }

    const totalItems = libraryMovies.data?.pages[0]?.meta.totalItems ?? 0;
    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="flex items-center gap-4 mb-10">
                <button
                    onClick={() => setSelectedLibId(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-white transition-all cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black text-white truncate max-w-75 md:max-w-125" title={libraryDetails.data?.library.name}>
                        {libraryDetails.data?.library.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text/40">
                            {totalItems} Movie{totalItems !== 1 && 's'} found
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {movies.map((item) => (
                    <MovieCard key={item.movieId} movie={item.movie} onClick={() => navigate(`/details/${item.movie.id}`)} />
                ))}

                {libraryMovies.isFetchingNextPage &&
                    Array(6)
                        .fill(0)
                        .map((_, i) => <MovieCardSkeleton key={`skeleton-${i}`} />)}
            </div>

            <div className="mt-12 flex justify-center pb-10">
                {libraryMovies.hasNextPage ? (
                    <button
                        onClick={() => libraryMovies.fetchNextPage()}
                        disabled={libraryMovies.isFetchingNextPage}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
                    >
                        {libraryMovies.isFetchingNextPage ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Loading more
                            </div>
                        ) : (
                            'Load More'
                        )}
                    </button>
                ) : (
                    movies.length > 0 && <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.3em]">End of collection</p>
                )}
            </div>
        </div>
    );
}
