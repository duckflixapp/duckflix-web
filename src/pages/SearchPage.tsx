import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Film, Clock, CalendarDays, ArrowDownAz, Star } from 'lucide-react';
import { MovieCard, MovieCardSkeleton } from '../components/movies/MovieCard';
import type { MovieDTO } from '@duckflix/shared';
import { useInfiniteMovies } from '../hooks/useMovies';
import { useInView } from 'react-intersection-observer';

type OrderType = 'newest' | 'oldest' | 'title' | 'rating';

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('query') || '';

    const [sortBy, setSortBy] = useState<OrderType>('newest');
    const [showFilters, setShowFilters] = useState(false);

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteMovies({ limit: 12, search: query, orderBy: sortBy });

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

    const openDetails = (movie: MovieDTO) => navigate(`/details/${movie.id}`);
    const changeSort = (option: OrderType) => setSortBy(option);

    const results = infiniteData?.pages.flatMap((page) => page.data) ?? [];
    const totalResults = infiniteData?.pages[0]?.meta?.totalItems ?? 0;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative w-full h-full min-h-screen">
            <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 px-6 md:px-12 py-12">
                <div className="flex w-full flex-col gap-8 mb-12">
                    <div className="w-full flex flex-col md:flex-row md:items-center justify-start md:justify-between md:gap-6 border-b border-white/5 pb-4">
                        <div className="w-full max-w-2xl">
                            <h1 className="text-3xl font-bold font-poppins text-text mb-2">Search Library</h1>
                            <p className="text-text/40 text-sm mb-6">Find movies, collections, and more in your database.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:flex items-end gap-2">
                                <div className="text-2xl font-bold text-text">{totalResults}</div>
                                <div className="text-xs text-text/40 uppercase tracking-widest font-bold">Results Found</div>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all ${showFilters ? 'bg-primary text-background border-primary' : 'bg-secondary/10 border-white/10 text-text hover:bg-secondary/20'}`}
                            >
                                <SlidersHorizontal size={18} />
                                <span className="font-bold text-sm">Filters</span>
                            </button>
                        </div>
                    </div>
                    <Filters hidden={!showFilters} sortBy={sortBy} changeSort={changeSort} />
                </div>
                {isLoading && results.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array(10)
                            .fill(0)
                            .map((_, i) => (
                                <MovieCardSkeleton key={i} />
                            ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {results.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} onClick={() => openDetails(movie)} />
                            ))}

                            {isFetchingNextPage &&
                                Array(6)
                                    .fill(0)
                                    .map((_, i) => <MovieCardSkeleton key={`loading-${i}`} />)}
                        </div>
                        <div ref={ref} className="h-20 w-full" />
                    </div>
                ) : (
                    query && !isLoading && <NoResults query={query} />
                )}
            </div>
        </div>
    );
}

function Filters({ hidden, sortBy, changeSort }: { hidden: boolean; sortBy: OrderType; changeSort: (val: OrderType) => void }) {
    if (hidden) return null;

    const sortOptions = [
        { id: 'newest', label: 'Latest Added', icon: Clock },
        { id: 'oldest', label: 'Oldest Added', icon: CalendarDays },
        { id: 'title', label: 'Alphabetical', icon: ArrowDownAz },
        { id: 'rating', label: 'Top Rated', icon: Star },
    ] as const;

    return (
        <div className="p-6 bg-white/2 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-text/40 uppercase tracking-widest">Sort By</span>
                <div className="flex flex-wrap gap-3">
                    {sortOptions.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => changeSort(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                                sortBy === id
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-secondary/10 text-text/70 border border-white/5 hover:bg-secondary/20 hover:text-text'
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function NoResults({ query }: { query: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500 gap-4">
            <div className="relative mb-2">
                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
                <div className="relative w-24 h-24 bg-secondary/10 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Film size={48} />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-text">No movies found</h3>
            <p className="text-text/30 max-w-md text-center">
                We couldn't find anything matching <span className="text-primary/70">"{query}"</span>.<br />
                Try adjusting your filters or search for something else.
            </p>
        </div>
    );
}
