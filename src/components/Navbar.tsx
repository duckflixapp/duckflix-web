import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { BellDot, ChevronRight, Loader2, Play, Search, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import type { MovieDTO, PaginatedResponse, UserDTO } from '@duckflix/shared';
import { api } from '../lib/api';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="relative h-18 z-50">
            <div className="px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
                <SearchBar />
                <div className="flex flex-row items-center gap-2 md:gap-4">
                    {!user ? (
                        <Link to="/login">Login</Link>
                    ) : (
                        <>
                            <NotificationBox />
                            <UserBox user={user} logout={logout} />
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

function SearchBar() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<MovieDTO[]>([]);
    const [totalResults, setTotalResults] = useState<number>(0);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const searchMovies = useCallback(async (query: string) => {
        if (query.length > 0) {
            setLoading(true);
            setShowResults(true);
            api.get<PaginatedResponse<MovieDTO>>('/movies/', {
                params: {
                    limit: 5,
                    search: query,
                },
            }).then((result) => {
                setLoading(false);
                setShowResults(true);
                setResults(result.data);
                setTotalResults(result.meta.totalItems);
            });
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchMovies(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [searchMovies, search]);

    const externalSearch = () => {
        inputRef.current?.blur();
        navigate('/search?query=' + encodeURIComponent(search));
        setShowResults(false);
    };

    const openDetails = (movie: MovieDTO) => {
        inputRef.current?.blur();
        navigate(`/details/${movie.id}`);
        setShowResults(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setShowResults(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onFocus = () => search.length > 0 && setShowResults(true);
    return (
        <div className="relative" ref={searchContainerRef}>
            <GlassyBox>
                <div className="flex items-center py-2.5" onClick={() => inputRef.current?.focus()}>
                    <Search size={18} className="mx-4 text-text/40 cursor-pointer" onClick={externalSearch} />
                    <input
                        value={search}
                        ref={inputRef}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && externalSearch()}
                        onFocus={onFocus}
                        type="search"
                        className="border-0 outline-0 pr-8 text-[13px] w-52 md:w-72 lg:w-96 bg-transparent text-text"
                        placeholder="Search movies..."
                    />
                    {loading && (
                        <div className="absolute right-3 animate-in fade-in duration-300">
                            <Loader2 size={18} className="animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </GlassyBox>

            <SearchResultBox
                hidden={!showResults || search.length == 0}
                results={results}
                moreResults={results.length > totalResults}
                onExternalSearch={externalSearch}
                onOpenMovie={openDetails}
            />
        </div>
    );
}

function SearchResultBox({
    results,
    moreResults,
    hidden: isHidden,
    onExternalSearch: externalSearch,
    onOpenMovie: openMovie,
}: {
    results: MovieDTO[];
    moreResults: boolean;
    hidden: boolean;
    onExternalSearch: () => unknown;
    onOpenMovie: (movie: MovieDTO) => unknown;
}) {
    if (isHidden) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-3 bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden z-60 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {results.length === 0 ? (
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
                <div className="p-2 flex flex-col gap-1">
                    {results.map((movie) => (
                        <div
                            key={movie.id}
                            className="p-2 hover:bg-white/5 rounded-2xl cursor-pointer flex items-center gap-4 group transition-all"
                            onClick={() => openMovie(movie)}
                        >
                            <div className="relative w-12 h-12 bg-secondary/20 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                {movie.posterUrl ? (
                                    <img
                                        src={movie.posterUrl}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text/20">
                                        <Play size={16} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 gap-1 min-w-0">
                                <span className="font-bold text-[13px] text-text/90 transition-colors truncate">{movie.title}</span>
                                <div className="flex items-center gap-2 text-[10px] text-text/40 font-medium tracking-tight">
                                    <span className="text-text/60 bg-white/5 px-1.5 py-0.5 rounded">{movie.releaseYear}</span>
                                    {movie.duration && (
                                        <span>
                                            {Math.floor(movie.duration / 3600)}h {Math.ceil(movie.duration / 60) % 60}m
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="pr-2">
                                <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {moreResults && (
                        <>
                            <div className="h-px w-full bg-white/10"></div>
                            <div
                                className="p-3 pb-2 text-center text-[11px] text-text/40 hover:text-primary transition-colors cursor-pointer font-bold uppercase tracking-widest"
                                onClick={externalSearch}
                            >
                                View all results
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function NotificationBox() {
    return (
        <GlassyBox>
            <div className="flex items-center justify-center p-3 cursor-pointer">
                <BellDot size={18} />
            </div>
        </GlassyBox>
    );
}

function UserBox({ user, logout }: { user: UserDTO; logout: () => unknown }) {
    return (
        <GlassyBox>
            <div className="flex items-center cursor-pointer p-3 gap-2" onClick={() => logout()}>
                <User size={18} />
                <p className="text-sm max-w-16 overflow-clip text-ellipsis">{user.name}</p>
            </div>
        </GlassyBox>
    );
}

function GlassyBox({ children }: PropsWithChildren) {
    return <div className="bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-2xl text-text/60">{children}</div>;
}
