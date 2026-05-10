import { useQuery } from '@tanstack/react-query';
import type { ContentDTO } from '@duckflixapp/shared';
import { ChevronRight, Loader2, Play, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchUnified } from '../../hooks/useSearch';
import { useNotificationSocket, type NotificationSocketData } from '../../hooks/useNotificationSocket';
import { toast } from 'sonner';
import { NotificationBox } from './Notifications';
import { ROUTES } from '../../config/routes';
import { accountNavbar, adminNavbar, navbar } from '../../config/navbar';
import UserMenu from './UserMenu';

export default function Navbar({ type = 'default' }: { type?: 'admin' | 'account' | 'default' }) {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const navItems = type === 'account' ? accountNavbar : type === 'admin' ? adminNavbar : navbar;

    const handleNotification = (data: NotificationSocketData) => {
        toast.success(data.title, {
            description: data.message,
            action:
                data.status == 'completed'
                    ? {
                          label: 'Watch Now',
                          onClick: () => navigate(`/details/${data.videoId}`),
                      }
                    : data.status == 'started'
                      ? {
                            label: 'Open',
                            onClick: () => navigate(`/details/${data.videoId}`),
                        }
                      : undefined,
        });
    };
    useNotificationSocket(handleNotification);

    if (!auth) return null;

    return (
        <nav className="fixed inset-x-0 top-0 z-50 h-18 sm:h-24 pointer-events-none">
            <NavbarScrim />
            <div className="relative h-full mx-6 md:mx-12">
                <div className="flex h-full items-center justify-between gap-3 min-[1200px]:block">
                    <div className="z-20 flex items-center gap-2 min-[1200px]:absolute min-[1200px]:left-0 min-[1200px]:top-1/2 min-[1200px]:-translate-y-1/2">
                        <NavbarBrand isAdmin={type === 'admin'} />
                        {type === 'default' && <SearchBar />}
                    </div>

                    <div className="pointer-events-auto z-30 hidden min-w-0 justify-center md:flex min-[1200px]:absolute min-[1200px]:left-1/2 min-[1200px]:top-1/2 min-[1200px]:-translate-x-1/2 min-[1200px]:-translate-y-1/2">
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-background/20 p-1 shadow-2xl shadow-black/20 backdrop-blur-xl">
                            <DesktopNavItems items={navItems} />
                        </div>
                    </div>
                    <div className="pointer-events-auto z-20 hidden min-w-0 justify-center md:flex min-[1200px]:absolute min-[1200px]:right-0 min-[1200px]:top-1/2 min-[1200px]:-translate-y-1/2">
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-background/20 p-1 shadow-2xl shadow-black/20">
                            <NavbarActions isAuthenticated={Boolean(auth.account)} />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavbarScrim() {
    return (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background via-background/75 to-transparent" />
    );
}

function NavbarBrand({ isAdmin }: { isAdmin: boolean }) {
    return (
        <Link
            to="/browse"
            className="pointer-events-auto flex items-center shrink-0 gap-3 rounded-full py-2 px-4 hover:shadow-lg text-shadow-lg transition-all hover:bg-white/8"
        >
            <span className="hidden sm:inline text-xl font-black uppercase tracking-tight text-text">Duckflix</span>
            {isAdmin && (
                <span className="hidden sm:inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Admin
                </span>
            )}
        </Link>
    );
}

function NavbarActions({ isAuthenticated }: { isAuthenticated: boolean }) {
    return (
        <>
            <div className="md:hidden">
                <SearchBar />
            </div>
            {!isAuthenticated ? (
                <Link to="/login">Login</Link>
            ) : (
                <>
                    <NotificationBox />
                    <UserMenu />
                </>
            )}
        </>
    );
}

function DesktopNavItems({ items }: { items: { key: string; text: string }[] }) {
    const location = useLocation();

    return items.map((item) => {
        const label = item.text;
        const link = ROUTES.routeOf(item.key);
        const isActive =
            item.key === 'admin' ? location.pathname === link : location.pathname === link || location.pathname.startsWith(`${link}/`);

        return (
            <Link
                key={item.key}
                to={link}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    isActive ? 'bg-white/14 text-text shadow-lg shadow-black/10' : 'text-text/72 hover:bg-white/7 hover:text-text'
                }`}
            >
                {label}
            </Link>
        );
    });
}

function SearchBar() {
    const [search, setSearch] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const listboxId = useId();
    const deferredSearch = useDeferredValue(search);
    const [debouncedSearch] = useDebounce(deferredSearch, 250);
    const trimmedSearch = debouncedSearch.trim();

    const searchQuery = useQuery({
        queryKey: ['search', 'quick', trimmedSearch],
        enabled: trimmedSearch.length > 0,
        retry: false,
        staleTime: 30_000,
        queryFn: ({ signal }) => fetchUnified({ limit: 5, q: trimmedSearch }, { signal }),
    });

    const results = searchQuery.data?.data ?? [];
    const totalResults = searchQuery.data?.meta.totalItems ?? 0;
    const loading = searchQuery.isFetching;
    const moreResults = results.length < totalResults;
    const hasQuery = search.trim().length > 0;
    const optionCount = results.length + (moreResults ? 1 : 0);
    const isDropdownOpen = showResults && hasQuery;
    const isExpanded = isFocused || hasQuery || isDropdownOpen;

    useEffect(() => {
        if (trimmedSearch.length > 0) {
            setShowResults(true);
        } else {
            setShowResults(false);
        }
        setActiveIndex(-1);
    }, [trimmedSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowResults(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const externalSearch = () => {
        const query = search.trim();
        if (!query) return;

        inputRef.current?.blur();
        navigate('/search?query=' + encodeURIComponent(query));
        setShowResults(false);
        setActiveIndex(-1);
    };

    const openDetails = (type: string, id: string) => {
        inputRef.current?.blur();
        navigate(`/details/${type}/${id}`);
        setShowResults(false);
        setActiveIndex(-1);
    };

    const onFocus = () => {
        setIsFocused(true);
        if (search.trim().length > 0) {
            setShowResults(true);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!hasQuery) return;

        if (event.key === 'Escape') {
            setShowResults(false);
            setActiveIndex(-1);
            inputRef.current?.blur();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setShowResults(true);
            if (optionCount > 0) {
                setActiveIndex((previous) => (previous + 1 + optionCount) % optionCount);
            }
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setShowResults(true);
            if (optionCount > 0) {
                setActiveIndex((previous) => (previous <= 0 ? optionCount - 1 : previous - 1));
            }
            return;
        }

        if (event.key !== 'Enter') return;

        event.preventDefault();

        if (activeIndex >= 0 && activeIndex < results.length) {
            const result = results[activeIndex];
            openDetails(result.type, result.id);
            return;
        }

        externalSearch();
    };

    return (
        <div className="relative flex-none pointer-events-auto" ref={searchContainerRef}>
            <div
                className={`rounded-full transition-all ${
                    isExpanded
                        ? 'border border-white/12 bg-background/15 text-text shadow-lg shadow-black/10 backdrop-blur-xl'
                        : 'border border-transparent text-text/80 hover:bg-white/7 hover:text-text'
                }`}
            >
                <div
                    className={`flex h-11 items-center overflow-hidden transition-[width] duration-300 ${isExpanded ? 'w-60' : 'h-11'}`}
                    onClick={() => inputRef.current?.focus()}
                >
                    <button
                        type="button"
                        aria-label="Search movies and series"
                        className="flex h-11 w-11 shrink-0 text-shadow-lg text-text cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (isExpanded && hasQuery) {
                                externalSearch();
                                return;
                            }
                            inputRef.current?.focus();
                        }}
                    >
                        <Search size={19} />
                    </button>
                    <input
                        value={search}
                        ref={inputRef}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={onFocus}
                        onBlur={() => setIsFocused(false)}
                        type="search"
                        role="combobox"
                        aria-label="Search movies and series"
                        aria-expanded={isDropdownOpen}
                        aria-controls={listboxId}
                        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                        aria-autocomplete="list"
                        className={`border-0 bg-transparent text-[13px] text-text outline-0 transition-all placeholder:text-text/30 focus:placeholder:text-transparent ${
                            isExpanded ? 'w-40 pr-8 opacity-100' : 'w-0 p-0 opacity-0'
                        }`}
                        placeholder="Search..."
                    />
                    {loading && isExpanded && (
                        <div className="absolute right-3 animate-in fade-in duration-300">
                            <Loader2 size={18} className="animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </div>

            <SearchResultBox
                hidden={!isDropdownOpen}
                listboxId={listboxId}
                results={results}
                activeIndex={activeIndex}
                loading={loading}
                moreResults={moreResults}
                onExternalSearch={externalSearch}
                onHoverIndex={setActiveIndex}
                onOpenDetails={openDetails}
            />
        </div>
    );
}

function SearchResultBox({
    activeIndex,
    results,
    listboxId,
    loading,
    moreResults,
    hidden: isHidden,
    onExternalSearch: externalSearch,
    onHoverIndex,
    onOpenDetails: openDetails,
}: {
    activeIndex: number;
    results: ContentDTO[];
    listboxId: string;
    loading: boolean;
    moreResults: boolean;
    hidden: boolean;
    onExternalSearch: () => unknown;
    onHoverIndex: (index: number) => void;
    onOpenDetails: (type: string, id: string) => unknown;
}) {
    if (isHidden) return null;

    return (
        <div
            className="fixed sm:absolute top-18 sm:top-full left-4 right-4 sm:left-0 sm:right-auto sm:w-80 md:w-96 
                mt-2 sm:mt-3 bg-background/72 backdrop-blur-3xl border border-white/12 
                rounded-2xl sm:rounded-3xl overflow-hidden z-60 shadow-2xl 
                animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {loading && results.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <div className="text-center">
                        <p className="text-sm font-bold text-text/80">Searching library</p>
                        <p className="text-[11px] text-text/40 mt-1">Fetching the best matches for you</p>
                    </div>
                </div>
            ) : results.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-white/5 rounded-full text-primary/80">
                        <Search size={28} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-text/80">No results found</p>
                        <p className="text-[11px] text-text/40 mt-1">Try searching for something else</p>
                    </div>
                </div>
            ) : (
                <div id={listboxId} role="listbox" className="p-2 flex flex-col gap-1">
                    {results.map((result, index) => (
                        <button
                            key={result.id}
                            id={`${listboxId}-option-${index}`}
                            role="option"
                            aria-selected={activeIndex === index}
                            type="button"
                            className={`p-2 rounded-2xl cursor-pointer flex items-center gap-4 group transition-all text-left ${
                                activeIndex === index ? 'bg-white/8 ring-1 ring-primary/30' : 'hover:bg-white/5'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                            onClick={() => openDetails(result.type, result.id)}
                            onMouseEnter={() => onHoverIndex(index)}
                        >
                            <div className="relative w-12 h-12 bg-secondary/20 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                {result.image ? (
                                    <img
                                        src={result.image}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        alt={result.title}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text/20">
                                        <Play size={16} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 gap-1 min-w-0">
                                <span className="font-bold text-[13px] text-text/90 transition-colors truncate">{result.title}</span>
                                <div className="flex items-center gap-2 text-[10px] text-text/40 font-medium tracking-tight">
                                    <span className="text-text/60 bg-white/5 px-1.5 py-0.5 rounded">{result.release}</span>
                                </div>
                            </div>
                            <div className="pr-2">
                                <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </button>
                    ))}
                    {moreResults && (
                        <>
                            <div className="h-px w-full bg-white/10"></div>
                            <button
                                id={`${listboxId}-option-${results.length}`}
                                role="option"
                                aria-selected={activeIndex === results.length}
                                type="button"
                                className={`p-3 pb-2 text-center text-[11px] transition-colors cursor-pointer font-bold uppercase tracking-widest rounded-2xl ${
                                    activeIndex === results.length ? 'text-primary bg-white/5' : 'text-text/40 hover:text-primary'
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                                onClick={externalSearch}
                                onMouseEnter={() => onHoverIndex(results.length)}
                            >
                                View all results
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
