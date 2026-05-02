import { useQuery } from '@tanstack/react-query';
import type { ContentDTO } from '@duckflixapp/shared';
import { ArrowDownUp, ChevronDown, ChevronRight, LayoutDashboard, Loader2, LogOut, Play, Search, Settings, User } from 'lucide-react';
import { useDeferredValue, useEffect, useId, useRef, useState, type KeyboardEvent, type PropsWithChildren } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchUnified } from '../../hooks/useSearch';
import { useNotificationSocket, type NotificationSocketData } from '../../hooks/useNotificationSocket';
import { toast } from 'sonner';
import { NotificationBox } from './Notifications';
import { useProfile } from '../../hooks/useProfile';

export default function Navbar() {
    const auth = useAuthContext();
    const navigate = useNavigate();

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
        <nav className="relative h-18 z-50">
            <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3">
                <Link to="/browse" className="flex sm:hidden items-center shrink-0">
                    <div className="w-9 h-9 flex items-center justify-center font-black text-3xl text-text">D</div>
                </Link>

                <SearchBar />
                <div className="flex flex-row items-center gap-2 md:gap-4">
                    {!auth.account ? (
                        <Link to="/login">Login</Link>
                    ) : (
                        <>
                            <NotificationBox />
                            <UserBox logout={auth.logout} />
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

function SearchBar() {
    const [search, setSearch] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
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
        <div className="relative" ref={searchContainerRef}>
            <GlassyBox>
                <div className="flex items-center py-3" onClick={() => inputRef.current?.focus()}>
                    <button
                        type="button"
                        aria-label="Open full search results"
                        className="mx-4 text-text/40 cursor-pointer transition-colors hover:text-text/80 focus-visible:text-text/80 focus-visible:outline-none"
                        onClick={(event) => {
                            event.stopPropagation();
                            externalSearch();
                        }}
                    >
                        <Search size={18} />
                    </button>
                    <input
                        value={search}
                        ref={inputRef}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={onFocus}
                        type="search"
                        role="combobox"
                        aria-label="Search movies and series"
                        aria-expanded={isDropdownOpen}
                        aria-controls={listboxId}
                        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                        aria-autocomplete="list"
                        className="border-0 outline-0 pr-8 text-[13px] w-full sm:w-52 md:w-72 lg:w-96 bg-transparent text-text placeholder:text-text/30 focus:placeholder:text-transparent"
                        placeholder="Search movies and series..."
                    />
                    {loading && (
                        <div className="absolute right-3 animate-in fade-in duration-300">
                            <Loader2 size={18} className="animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </GlassyBox>

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
            className="fixed sm:absolute top-18 sm:top-full left-4 right-4 sm:left-0 sm:right-0 
                mt-2 sm:mt-3 bg-secondary/15 backdrop-blur-3xl border border-white/10 
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

function UserBox({ logout }: { logout: () => unknown }) {
    const auth = useAuthContext();
    const { logout: switchProfile } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        {
            label: 'Admin Panel',
            icon: LayoutDashboard,
            onClick: () => navigate('/admin'),
            show: auth?.hasRole('admin'),
        },
        {
            label: 'Switch Profile',
            icon: ArrowDownUp,
            onClick: () => switchProfile(),
            show: true,
        },
        {
            label: 'Account',
            icon: Settings,
            onClick: () => navigate('/account/'),
            show: true,
        },
    ];

    if (!auth) return null;
    const displayName = auth.profile?.name ?? 'Account';

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className={`flex items-center p-3 gap-3 bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-3xl text-text/60 transition-all cursor-pointer hover:bg-white/5 ${isOpen ? 'ring-2 ring-primary/50 text-primary' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="rounded-lg">
                    <User size={18} />
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="fixed sm:absolute top-18 sm:top-full left-4 right-4 sm:left-auto sm:right-0 
                    mt-2 sm:mt-4 sm:w-64 bg-background/60 backdrop-blur-3xl 
                    border border-white/10 rounded-3xl
                    shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-4"
                >
                    <div className="p-2 flex flex-col gap-1">
                        <div className="p-3.5 pt-2 mb-1 border-b border-white/5">
                            <p className="text-sm font-bold text-text truncate line-clamp-1">{displayName}</p>
                            <p className="text-xs text-text/40 truncate line-clamp-1">{auth.account?.email}</p>
                        </div>

                        {menuItems
                            .filter((item) => item.show)
                            .map((item, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => {
                                        item.onClick();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full py-2.5 px-3.5 text-left text-[13px] cursor-pointer font-medium text-text/80 hover:bg-white/5 hover:text-primary rounded-2xl transition-all group"
                                >
                                    <item.icon size={16} className="group-hover:scale-110 transition-transform" />
                                    {item.label}
                                </button>
                            ))}

                        <div className="h-px bg-white/5 my-1" />

                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full py-2.5 px-3.5 text-left text-[13px] cursor-pointer font-medium text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
                        >
                            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function GlassyBox({ children }: PropsWithChildren) {
    return <div className="bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-3xl text-text/60">{children}</div>;
}
