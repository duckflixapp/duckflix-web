import { Film, Info, Tv } from 'lucide-react';
import { type CatalogItem, type CatalogKind } from '../../hooks/useCatalog';
import { getHeroMeta } from './catalog-utils';

interface CatalogHeroProps {
    item: CatalogItem | null;
    kind: CatalogKind;
    title: string;
    eyebrow: string;
    description: string;
    loading: boolean;
    onOpenDetails: () => void;
}

export function CatalogHero({ item, kind, title, eyebrow, description, loading, onOpenDetails }: CatalogHeroProps) {
    if (loading) {
        return (
            <section className="relative aspect-21/9 min-h-96 max-h-[70vh] overflow-hidden pt-24 animate-pulse sm:min-h-128">
                <div className="absolute inset-0 bg-white/5" />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/20" />
                <div className="relative z-10 flex h-full min-h-96 flex-col justify-end px-6 pb-10 sm:px-10 md:px-16">
                    <div className="h-4 w-28 rounded-full bg-white/10" />
                    <div className="mt-5 h-14 w-full max-w-xl rounded-2xl bg-white/10" />
                    <div className="mt-4 h-5 w-full max-w-lg rounded-full bg-white/5" />
                </div>
            </section>
        );
    }

    const heroTitle = item?.title ?? title;
    const backdrop = item?.bannerUrl ?? item?.posterUrl ?? null;
    const meta = item ? getHeroMeta(item) : [];

    return (
        <section className="relative aspect-21/9 min-h-110 max-h-[70vh] overflow-hidden pt-24 sm:min-h-128">
            {backdrop ? (
                <>
                    <div className="absolute inset-0 bg-background" />
                    <img
                        src={backdrop}
                        alt=""
                        aria-hidden="true"
                        className="absolute -inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] scale-110 object-cover object-center opacity-70 blur-3xl brightness-[0.65] saturate-150"
                    />
                    <img
                        src={backdrop}
                        alt={heroTitle}
                        className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center brightness-[0.72] saturate-110"
                    />
                </>
            ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(181,200,255,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(7,8,13,0.9))]" />
            )}
            <div className="absolute inset-y-0 left-0 w-2/3 bg-linear-to-r from-background/85 via-background/35 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-background/45 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/5 to-background/20" />

            <div className="relative z-10 flex h-full min-h-96 max-w-5xl flex-col justify-end px-6 pb-10 sm:px-10 md:px-16">
                <span className="mb-4 flex w-fit items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md">
                    {kind === 'movies' ? <Film size={13} /> : <Tv size={13} />}
                    {eyebrow}
                </span>
                <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white text-shadow-2xs text-shadow-black sm:text-6xl">
                    {heroTitle}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    {meta.map((label) => (
                        <span
                            key={label}
                            className="rounded-3xl border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/75 backdrop-blur-md"
                        >
                            {label}
                        </span>
                    ))}
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-text/65 sm:text-base">{item?.overview ?? description}</p>
                {item && (
                    <button
                        type="button"
                        onClick={onOpenDetails}
                        className="mt-7 flex w-fit items-center gap-3 rounded-4xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 cursor-pointer"
                    >
                        <Info size={18} />
                        Details
                    </button>
                )}
            </div>
        </section>
    );
}
