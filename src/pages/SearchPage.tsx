import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, SlidersHorizontal, Film, Search } from 'lucide-react';
import { api } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/movies/MovieCard';
import type { MovieDTO, PaginatedResponse } from '@duckflix/shared';

type SortCriteria = 'latest' | 'oldest' | 'alphabetical' | 'rating';

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('query') || '';

    const [results, setResults] = useState<MovieDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);

    const [sortBy, setSortBy] = useState<SortCriteria>('latest');
    const [showFilters, setShowFilters] = useState(false);

    const fetchMovies = useCallback(
        async (loadMore = false) => {
            setLoading(true);
            try {
                const currentPage = loadMore ? page + 1 : 1;

                const response = await api.get<PaginatedResponse<MovieDTO>>('/movies/', {
                    params: {
                        limit: 12,
                        page: currentPage,
                        search: query,
                        sort: sortBy,
                    },
                });

                if (loadMore) {
                    setResults((prev) => [...prev, ...response.data]);
                    setPage(currentPage);
                } else {
                    setResults(response.data);
                    setPage(1);
                }

                setTotalResults(response.meta.totalItems);
                setHasMore(response.meta.currentPage < response.meta.totalPages);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        },
        [query, sortBy, page]
    );

    useEffect(() => {
        fetchMovies(false);
    }, [fetchMovies]);

    const openDetails = (movie: MovieDTO) => navigate(`/details/${movie.id}`);
    const changeSort = (option: SortCriteria) => setSortBy(option);

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
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${showFilters ? 'bg-primary text-background border-primary' : 'bg-secondary/10 border-white/10 text-text hover:bg-secondary/20'}`}
                            >
                                <SlidersHorizontal size={18} />
                                <span className="font-bold text-sm">Filters</span>
                            </button>
                        </div>
                    </div>
                    <Filters hidden={!showFilters} sortBy={sortBy} changeSort={changeSort} />
                </div>
                {loading && results.length === 0 ? (
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
                        </div>

                        {hasMore && (
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={() => fetchMovies(true)}
                                    disabled={loading}
                                    className="group cursor-pointer relative px-8 py-3 bg-secondary/20 hover:bg-primary hover:text-background border border-white/10 rounded-2xl transition-all duration-300 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3 font-bold text-sm tracking-wide">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                        LOAD MORE MOVIES
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    query && !loading && <NoResults query={query} />
                )}
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

function Filters({ hidden }: { hidden: boolean; sortBy: string; changeSort: (criteria: SortCriteria) => unknown }) {
    if (hidden) return null;
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/2 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2"></div>
    );
}
