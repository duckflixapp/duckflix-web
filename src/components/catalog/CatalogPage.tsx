import { Film, Tv, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { CardSkeleton, ContentCard } from '../content/ContentCard';
import { useMovieGenres } from '../../hooks/use-genres';
import { type CatalogItem, type CatalogKind, type CatalogOrder, useInfiniteCatalog } from '../../hooks/useCatalog';
import { CatalogEmptyState } from './CatalogEmptyState';
import { GenreDropdown, type GenreOption, SearchInput, SORT_OPTIONS, SortDropdown } from './CatalogFilters';
import { CatalogHero } from './CatalogHero';
import { isMovie, toContentDTO } from './catalog-utils';

interface CatalogPageProps {
    kind: CatalogKind;
    title: string;
    eyebrow: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
}

export function CatalogPage({ kind, title, eyebrow, description, emptyTitle, emptyDescription }: CatalogPageProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { genres: movieGenres } = useMovieGenres(kind === 'movies');

    const orderBy = (searchParams.get('sort') as CatalogOrder | null) ?? 'newest';
    const genreId = searchParams.get('genre') ?? '';
    const query = searchParams.get('q') ?? '';
    const [searchValue, setSearchValue] = useState(query);
    const [debouncedSearch] = useDebounce(searchValue, 350);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteCatalog({
        kind,
        limit: 24,
        orderBy,
        search: query,
        genreId,
    });

    const { ref, inView } = useInView({ rootMargin: '400px' });
    const items = data?.pages.flatMap((page) => page.data) ?? [];
    const totalItems = data?.pages[0]?.meta.totalItems ?? 0;
    const isInitialLoading = isLoading && items.length === 0;
    const selectedSort = SORT_OPTIONS.find((option) => option.id === orderBy) ?? SORT_OPTIONS[0];
    const genreOptions = useGenreOptions(kind, items, movieGenres ?? []);
    const selectedGenre = genreOptions.find((genre) => genre.id === genreId);
    const heroItem = items.find((item) => item.bannerUrl) ?? items[0] ?? null;
    const contentType = kind === 'movies' ? 'movie' : 'series';

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

    useEffect(() => {
        setSearchValue(query);
    }, [query]);

    useEffect(() => {
        const normalized = debouncedSearch.trim();
        if (normalized === query) return;

        setSearchParams((params) => {
            const nextParams = new URLSearchParams(params);
            if (normalized) nextParams.set('q', normalized);
            else nextParams.delete('q');
            return nextParams;
        });
    }, [debouncedSearch, query, setSearchParams]);

    const updateParam = (key: string, value: string | null) => {
        setSearchParams((params) => {
            const nextParams = new URLSearchParams(params);
            if (value) nextParams.set(key, value);
            else nextParams.delete(key);
            return nextParams;
        });
    };

    const openDetails = (item: CatalogItem) => navigate(`/details/${contentType}/${item.id}`);
    const clearFilters = () => {
        setSearchValue('');
        setSearchParams(new URLSearchParams());
    };

    return (
        <div className="min-h-screen pb-20">
            <CatalogHero
                item={heroItem}
                kind={kind}
                title={title}
                eyebrow={eyebrow}
                description={description}
                loading={isInitialLoading}
                onOpenDetails={() => heroItem && openDetails(heroItem)}
            />

            <section className="relative z-10 px-6 sm:px-10 md:px-16 pt-8">
                <div className="flex flex-col gap-5 border-b border-white/5 pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-primary">
                                {kind === 'movies' ? <Film size={19} /> : <Tv size={19} />}
                            </span>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-text font-poppins">{title}</h1>
                                <p className="text-sm text-text/40">
                                    {totalItems > 0 ? `${totalItems} title${totalItems === 1 ? '' : 's'} available` : description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <SearchInput value={searchValue} onChange={setSearchValue} onClear={() => setSearchValue('')} />
                        <div className="flex flex-wrap items-center gap-3">
                            <SortDropdown value={selectedSort.id} onChange={(value) => updateParam('sort', value)} />
                            <GenreDropdown
                                genres={genreOptions}
                                selectedGenre={selectedGenre}
                                onChange={(value) => updateParam('genre', value)}
                            />
                            {(query || genreId || orderBy !== 'newest') && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="flex h-11 items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-text/60 transition-all hover:bg-white/8 hover:text-text cursor-pointer"
                                >
                                    <X size={15} />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    {isInitialLoading ? (
                        <CatalogGridSkeleton />
                    ) : items.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                {items.map((item) => (
                                    <ContentCard key={item.id} content={toContentDTO(item, kind)} onClick={() => openDetails(item)} />
                                ))}
                                {isFetchingNextPage &&
                                    Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={`catalog-loading-${index}`} />)}
                            </div>
                            <div ref={ref} className="h-20 w-full" />
                        </>
                    ) : (
                        <CatalogEmptyState
                            title={query || genreId ? 'No matches found' : emptyTitle}
                            description={query || genreId ? 'Try another search, genre, or sort option.' : emptyDescription}
                            onClear={query || genreId ? clearFilters : undefined}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

function useGenreOptions(kind: CatalogKind, items: CatalogItem[], movieGenres: GenreOption[]) {
    return useMemo(() => {
        if (kind === 'movies') return movieGenres;

        const options = new Map<string, GenreOption>();
        items.forEach((item) => {
            if (isMovie(item)) return;
            item.genres.forEach((genre) => options.set(genre.id, genre));
        });

        return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [items, kind, movieGenres]);
}

function CatalogGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
                <CardSkeleton key={index} />
            ))}
        </div>
    );
}
