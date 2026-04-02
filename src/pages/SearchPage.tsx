import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Film, Clock, ArrowDownAz, Star, CalendarArrowDown } from 'lucide-react';
import { CardSkeleton } from '../components/content/ContentCard';
import { useInView } from 'react-intersection-observer';
import { useMovieGenres } from '../hooks/use-genres';
import { useInfiniteSearch, type SortField, type SortOrder } from '../hooks/useSearch';
import { ContentCard } from '../components/content/ContentCard';
import type { ContentDTO } from '@duckflix/shared';

const countFilters = (...args: (unknown | undefined | null)[]): number => {
    return args.reduce<number>((p, val) => p + (val != null && val != undefined ? 1 : 0), 0);
};

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState<boolean>();
    const navigate = useNavigate();

    const query = searchParams.get('query') ?? '';
    const sort = (searchParams.get('sort')?.split(',').filter(Boolean) as [SortField, SortOrder]) ?? null;
    const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) ?? [];

    const filtersCount = countFilters(...selectedGenres);

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteSearch({ limit: 20, q: query, sort, genres: selectedGenres });

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

    const updateParams = (updates: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    const changeSort = (sort: string) => updateParams({ sort: sort ?? null });
    const changeGenres = (genres: string[]) => updateParams({ genres: genres.filter(Boolean).join(',') });
    const openDetails = (result: ContentDTO) => navigate(`/details/${result.type}/${result.id}`);

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
                            <p className="text-text/40 text-sm mb-6">Find movies and series in your database.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
                                <span className="text-xl font-bold text-text">{totalResults}</span>
                                <span className="text-[10px] text-text/40 uppercase tracking-widest font-bold">Results</span>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-3xl border cursor-pointer transition-all ${showFilters ? 'bg-primary text-background border-primary' : 'bg-secondary/10 border-white/10 text-text hover:bg-secondary/20'}`}
                            >
                                <SlidersHorizontal size={18} />
                                <span className="font-bold text-sm">Filters</span>
                                {filtersCount > 0 && <span>{filtersCount}</span>}
                            </button>
                        </div>
                    </div>
                    <Filters
                        hidden={!showFilters}
                        sort={sort}
                        changeSort={changeSort}
                        selectedGenres={selectedGenres}
                        setSelectedGenres={changeGenres}
                    />
                </div>
                {isLoading && results.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array(10)
                            .fill(0)
                            .map((_, i) => (
                                <CardSkeleton key={i} />
                            ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {results.map((result) => (
                                <ContentCard key={result.id} content={result} onClick={() => openDetails(result)} />
                            ))}

                            {isFetchingNextPage &&
                                Array(6)
                                    .fill(0)
                                    .map((_, i) => <CardSkeleton key={`loading-${i}`} />)}
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

const sortOptions = [
    { id: 'date,desc', label: 'Latest Added', icon: Clock },
    { id: 'title,asc', label: 'Alphabetical', icon: ArrowDownAz },
    { id: 'rating,desc', label: 'Best Rated', icon: Star },
    { id: 'release,desc', label: 'Released Year', icon: CalendarArrowDown },
] as const;

function Filters({
    hidden,
    sort,
    changeSort,
    selectedGenres,
    setSelectedGenres,
}: {
    hidden: boolean;
    sort: [SortField, SortOrder] | null;
    changeSort: (sort: string) => void;
    selectedGenres: string[];
    setSelectedGenres: (val: string[]) => void;
}) {
    const { genres } = useMovieGenres();

    if (hidden) return null;

    const handleGenreClick = (genre: string) =>
        setSelectedGenres(selectedGenres.includes(genre) ? selectedGenres.filter((g) => g !== genre) : [...selectedGenres, genre]);

    return (
        <div className="flex flex-col gap-4 p-6 bg-white/2 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-text/40 uppercase tracking-widest">Sort By</span>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar-buttons snap-x">
                    {sortOptions.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => changeSort(id)}
                            className={`flex items-center flex-nowrap gap-2 px-4 py-2 rounded-full text-xs transition-all border snap-start ${
                                sort?.join(',') == id
                                    ? 'bg-primary text-background border-primary'
                                    : 'bg-secondary/10 text-text/60 border-white/5 hover:bg-secondary/20'
                            }`}
                        >
                            <Icon size={16} />
                            <span className="text-nowrap">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-text/40 uppercase tracking-widest">Genres</span>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar-buttons snap-x">
                    {genres?.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => handleGenreClick(genre.name)}
                            className={`flex-none px-4 py-2 rounded-full text-xs transition-all border snap-start ${
                                selectedGenres.includes(genre.name)
                                    ? 'bg-primary text-background border-primary'
                                    : 'bg-secondary/10 text-text/60 border-white/5 hover:bg-secondary/20'
                            }`}
                        >
                            <span className="text-nowrap">{genre.name}</span>
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
