import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Film, Clock, ArrowDownAz, Star, CalendarArrowDown, ChevronDown, Search, X } from 'lucide-react';
import { CardSkeleton } from '../components/content/ContentCard';
import { useInView } from 'react-intersection-observer';
import { useMovieGenres } from '../hooks/use-genres';
import { useInfiniteSearch, type SortField, type SortOrder } from '../hooks/useSearch';
import { ContentCard } from '../components/content/ContentCard';
import type { ContentDTO } from '@duckflixapp/shared';
import { capitalize } from '../utils/string';

const sortOptions = [
    { id: 'date,desc', label: 'Latest Added', icon: Clock },
    { id: 'title,asc', label: 'Alphabetical', icon: ArrowDownAz },
    { id: 'rating,desc', label: 'Best Rated', icon: Star },
    { id: 'release,desc', label: 'Released Year', icon: CalendarArrowDown },
] as const;

function DropdownFilter({
    label,
    activeLabel,
    count,
    children,
}: {
    label: string;
    activeLabel?: string;
    count?: number;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isActive = !!activeLabel || !!count;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-3xl border text-sm font-medium cursor-pointer transition-all ${
                    isActive
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-white/5 border-white/10 text-text/70 hover:bg-white/8 hover:text-text'
                }`}
            >
                <span className="truncate">{activeLabel ?? label}</span>
                {count != null && count > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-background text-[11px] font-bold">
                        {count}
                    </span>
                )}
                <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full mt-2 right-0 z-50 min-w-56 bg-background/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {children}
                </div>
            )}
        </div>
    );
}

function SortDropdown({ sort, changeSort }: { sort: [SortField, SortOrder] | null; changeSort: (s: string) => void }) {
    const active = sortOptions.find((o) => o.id === sort?.join(','));

    return (
        <DropdownFilter label="Sort By" activeLabel={active?.label}>
            <div className="p-2">
                {sortOptions.map(({ id, label, icon: Icon }) => {
                    const isSelected = sort?.join(',') === id;
                    return (
                        <button
                            key={id}
                            onClick={() => changeSort(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-3xl text-sm transition-all cursor-pointer ${
                                isSelected ? 'bg-primary/15 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'
                            }`}
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        </DropdownFilter>
    );
}

function GenresDropdown({ selectedGenres, setSelectedGenres }: { selectedGenres: string[]; setSelectedGenres: (v: string[]) => void }) {
    const { genres } = useMovieGenres();
    const [search, setSearch] = useState('');

    const filtered = genres?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) ?? [];

    const toggle = (name: string) =>
        setSelectedGenres(selectedGenres.includes(name) ? selectedGenres.filter((g) => g !== name) : [...selectedGenres, name]);

    return (
        <DropdownFilter label="Genres" count={selectedGenres.length}>
            <div className="p-2 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-3xl border border-white/8 mx-0.5">
                    <Search size={13} className="text-text/30 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search genres..."
                        className="bg-transparent text-sm text-text placeholder:text-text/30 outline-none w-full"
                        autoFocus
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-text/30 hover:text-text/60 transition-colors">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {selectedGenres.length > 0 && (
                    <button
                        onClick={() => setSelectedGenres([])}
                        className="w-full text-left px-3 py-2 text-xs text-text/30 hover:text-primary transition-colors cursor-pointer"
                    >
                        Clear all
                    </button>
                )}

                <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5 scrollbar-none">
                    {filtered.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.name);
                        return (
                            <button
                                key={genre.id}
                                onClick={() => toggle(genre.name)}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-3xl text-sm transition-all cursor-pointer ${
                                    isSelected ? 'bg-primary/15 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'
                                }`}
                            >
                                <span>{capitalize(genre.name)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </DropdownFilter>
    );
}

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get('query') ?? '';
    const sort = (searchParams.get('sort')?.split(',').filter(Boolean) as [SortField, SortOrder]) ?? null;
    const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) ?? [];

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteSearch({
        limit: 20,
        q: query,
        sort,
        genres: selectedGenres,
    });

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

    const updateParams = (updates: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) newParams.delete(key);
            else newParams.set(key, value);
        });
        setSearchParams(newParams);
    };

    const changeSort = (sort: string) => updateParams({ sort });
    const changeGenres = (genres: string[]) => updateParams({ genres: genres.join(',') || null });
    const openDetails = (result: ContentDTO) => navigate(`/details/${result.type}/${result.id}`);

    const results = infiniteData?.pages.flatMap((page) => page.data) ?? [];
    const totalResults = infiniteData?.pages[0]?.meta?.totalItems ?? 0;

    return (
        <div className="flex-1 relative w-full h-full min-h-screen">
            <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 px-10 py-12 md:px-16">
                <div className="flex w-full flex-col gap-6 mb-12">
                    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-poppins text-text mb-1">Search Library</h1>
                            <p className="text-text/40 text-sm">Find movies and series in your database.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {totalResults > 0 && (
                                <div className="hidden md:flex items-center gap-2 mr-2 border-r border-white/10 pr-4">
                                    <span className="text-xl font-bold text-text">{totalResults}</span>
                                    <span className="text-[10px] text-text/40 uppercase tracking-widest font-bold">Results</span>
                                </div>
                            )}
                            <SortDropdown sort={sort} changeSort={changeSort} />
                            <GenresDropdown selectedGenres={selectedGenres} setSelectedGenres={changeGenres} />
                        </div>
                    </div>
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
