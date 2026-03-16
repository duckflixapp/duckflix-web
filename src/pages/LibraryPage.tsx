import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { MovieCard, MovieCardSkeleton } from '../components/movies/MovieCard';
import { Library, ArrowLeft, Loader2, ClockFading } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export default function LibraryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const selectedLibId = searchParams.get('id');
    const { libraries: librariesQuery, libraryMovies, libraryDetails } = useLibrary(selectedLibId ?? undefined);

    const { ref, inView } = useInView();

    const movies = libraryMovies.data?.pages.flatMap((page) => page.data) ?? [];
    const libraries = librariesQuery.data?.libraries ?? [];

    useEffect(() => {
        if (inView && libraryMovies.hasNextPage && !libraryMovies.isFetchingNextPage) {
            libraryMovies.fetchNextPage();
        }
    }, [inView, libraryMovies]);

    const selectLibrary = (id: string | null) => {
        if (id) setSearchParams({ id });
        else setSearchParams({});
    };

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
                                  onClick={() => selectLibrary(lib.id)}
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
    const libType = libraryDetails.data?.library.type;
    const isInitialLoading = libraryMovies.isLoading;

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
                        {libraryMovies.isFetching && <Loader2 size={20} className="animate-spin text-primary" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text/40">
                            {totalItems} Movie{totalItems !== 1 && 's'} found
                        </span>
                    </div>
                </div>
            </div>

            {!isInitialLoading && movies.length === 0 ? (
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
                        Browse Movies
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {movies.map((item) => (
                        <MovieCard key={item.movieId} movie={item.movie} onClick={() => navigate(`/details/${item.movie.id}`)} />
                    ))}

                    {(isInitialLoading || libraryMovies.isFetchingNextPage) &&
                        Array(6)
                            .fill(0)
                            .map((_, i) => <MovieCardSkeleton key={`skeleton-${i}`} />)}
                </div>
            )}

            <div ref={ref} className="h-20 w-full flex items-center justify-center mt-8">
                {libraryMovies.isFetchingNextPage && (
                    <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading more content...</p>
                )}
                {!libraryMovies.hasNextPage && movies.length > 0 && (
                    <p className="text-text/20 text-[10px] font-black uppercase tracking-[0.3em]">
                        End of {libraryDetails.data?.library.name}
                    </p>
                )}
            </div>
        </div>
    );
}
