import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { BellDot, Loader2, Search, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import type { MovieDTO, PaginatedResponse, UserDTO } from '@duckflix/shared';
import { api } from '../lib/api';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="relative h-18 z-50">
            <div className="px-8 h-full flex items-center justify-between">
                <SearchBar />
                <div className="flex flex-row items-center gap-4">
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
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const searchMovies = useCallback(async (query: string) => {
        if (query.length > 0) {
            setLoading(true);
            setShowResults(true);
            api.get<PaginatedResponse<MovieDTO>>('/movies/?limit=5&search=' + query).then((result) => {
                setLoading(false);
                setShowResults(true);
                setResults(result.data.data);
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
    };

    const onBlur = () => setShowResults(false);
    const onFocus = () => search.length > 0 && setShowResults(true);
    return (
        <div className="relative group">
            <GlassyBox>
                <div className="flex items-center py-2.5" onClick={() => inputRef.current?.focus()}>
                    <Search size={18} className="mx-4 text-text/40 cursor-pointer" onClick={externalSearch} />
                    <input
                        value={search}
                        ref={inputRef}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && externalSearch()}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        type="search"
                        className="border-0 outline-0 pr-8 text-[13px] w-96 bg-transparent text-text"
                        placeholder="Search movies..."
                    />
                    {loading && (
                        <div className="absolute right-3 animate-in fade-in duration-300">
                            <Loader2 size={18} className="animate-spin text-accent" />
                        </div>
                    )}
                </div>
            </GlassyBox>

            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden z-60">
                    {results.length === 0 && (
                        <div className="p-8 flex flex-col items-center justify-center gap-3">
                            <div className="p-3 bg-accent/10 rounded-full text-accent/50">
                                <Search size={24} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-text/80">No results found</p>
                                <p className="text-[11px] text-text/40 mt-1">Try searching for something else</p>
                            </div>
                        </div>
                    )}
                    {results.map((movie) => (
                        <div key={movie.id} className="p-3 hover:bg-white/5 cursor-pointer text-sm">
                            {movie.title}
                        </div>
                    ))}
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
    return <div className="bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-xl text-text/60">{children}</div>;
}
