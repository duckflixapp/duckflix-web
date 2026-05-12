import type { MovieGenreDTO, SeriesGenreDTO } from '@duckflixapp/shared';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownAz, CalendarArrowDown, ChevronDown, Clock, ListFilter, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import type { CatalogOrder } from '../../hooks/useCatalog';
import { capitalize } from '../../utils/string';

export type GenreOption = MovieGenreDTO | SeriesGenreDTO;

export const SORT_OPTIONS = [
    { id: 'newest', label: 'Recently added', icon: Clock },
    { id: 'rating', label: 'Top rated', icon: Star },
    { id: 'title', label: 'A-Z', icon: ArrowDownAz },
    { id: 'oldest', label: 'Oldest added', icon: CalendarArrowDown },
] as const;

export function SearchInput({ value, onChange, onClear }: { value: string; onChange: (value: string) => void; onClear: () => void }) {
    return (
        <label className="flex h-11 min-w-0 items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 text-text transition-all focus-within:border-primary/40 focus-within:bg-white/8 xl:w-80">
            <Search size={17} className="shrink-0 text-text/35" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search titles"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/30"
            />
            {value && (
                <button type="button" onClick={onClear} className="text-text/35 transition-colors hover:text-text cursor-pointer">
                    <X size={15} />
                </button>
            )}
        </label>
    );
}

export function SortDropdown({ value, onChange }: { value: CatalogOrder; onChange: (value: CatalogOrder) => void }) {
    const active = SORT_OPTIONS.find((option) => option.id === value) ?? SORT_OPTIONS[0];

    return (
        <Dropdown
            label="Sort"
            activeLabel={active.label}
            icon={<SlidersHorizontal size={15} />}
            contentClassName="right-auto left-0 sm:left-auto sm:right-0"
        >
            <div className="p-2">
                {SORT_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const isSelected = id === value;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => onChange(id)}
                            className={`flex w-full items-center gap-3 rounded-3xl px-3 py-2 text-sm transition-all cursor-pointer ${
                                isSelected ? 'bg-primary/15 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'
                            }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    );
                })}
            </div>
        </Dropdown>
    );
}

export function GenreDropdown({
    genres,
    selectedGenre,
    onChange,
}: {
    genres: GenreOption[];
    selectedGenre?: GenreOption;
    onChange: (value: string | null) => void;
}) {
    const [search, setSearch] = useState('');
    const filteredGenres = genres.filter((genre) => genre.name.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <Dropdown label="Genre" activeLabel={selectedGenre ? capitalize(selectedGenre.name) : undefined} icon={<ListFilter size={15} />}>
            <div className="flex max-h-80 flex-col gap-1 p-2">
                <label className="mx-1 mb-1 flex items-center gap-2 rounded-3xl border border-white/8 bg-white/5 px-3 py-2">
                    <Search size={13} className="text-text/30" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Find genre"
                        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/30"
                    />
                </label>

                {selectedGenre && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="rounded-3xl px-3 py-2 text-left text-xs font-medium text-text/35 transition-colors hover:text-primary cursor-pointer"
                    >
                        All genres
                    </button>
                )}

                <div className="custom-scrollbar max-h-56 overflow-y-auto">
                    {filteredGenres.length > 0 ? (
                        filteredGenres.map((genre) => {
                            const isSelected = genre.id === selectedGenre?.id;
                            return (
                                <button
                                    key={genre.id}
                                    type="button"
                                    onClick={() => onChange(genre.id)}
                                    className={`flex w-full items-center rounded-3xl px-3 py-2 text-left text-sm transition-all cursor-pointer ${
                                        isSelected ? 'bg-primary/15 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'
                                    }`}
                                >
                                    {capitalize(genre.name)}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-3 py-5 text-center text-xs text-text/35">No genres</div>
                    )}
                </div>
            </div>
        </Dropdown>
    );
}

function Dropdown({
    label,
    activeLabel,
    icon,
    children,
    contentClassName = 'right-0',
}: {
    label: string;
    activeLabel?: string;
    icon: ReactNode;
    children: ReactNode;
    contentClassName?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`flex h-11 items-center gap-2 rounded-3xl border px-4 text-sm font-medium transition-all cursor-pointer ${
                    activeLabel
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-text/70 hover:bg-white/8 hover:text-text'
                }`}
            >
                {icon}
                <span className="max-w-36 truncate">{activeLabel ?? label}</span>
                <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute top-full z-50 mt-2 min-w-60 rounded-3xl border border-white/10 bg-background/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${contentClassName}`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
