import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, ChevronLeft, Layers } from 'lucide-react';
import { useSeriesDetailed } from '../../hooks/useSeriesDetailed';

import type { SeriesGenreDTO } from '@duckflix/shared';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';
import VideoNotFound from '../../components/details/VideoNotFound';
import WatchlistButton from '../../components/buttons/WatchlistButton';
import VideoOverview from '../../components/details/VideoOverview';
import { useLibrary } from '../../hooks/useLibrary';

export default function SeriesDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { addContent, removeContent } = useLibrary();

    const { series, isLoading, isNotFound } = useSeriesDetailed(id);

    if (isLoading) return <DetailsSkeleton />;
    if (isNotFound) return <VideoNotFound />;
    if (!series) return null;

    const releaseYear = series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : null;

    const handleToWatchlist = () => {
        if (series.inUserLibrary) removeContent({ libId: 'watchlist', contentId: series.id, contentType: 'series' });
        else addContent({ libId: 'watchlist', contentId: series.id, contentType: 'series' });
    };

    const openSeasonDetails = (seasonId: string) => navigate(`/details/season/${seasonId}`);
    const handleGenreClick = (genre: SeriesGenreDTO) => navigate('/search?genres=' + encodeURIComponent(genre.name));
    const handleGoBack = () => navigate('/browse');

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative w-full aspect-21/9 min-h-140 overflow-hidden">
                <div className="absolute inset-0 rounded-tl-xl overflow-hidden">
                    {series.bannerUrl ? (
                        <img src={series.bannerUrl} alt={series.title} className="w-full h-full object-cover" />
                    ) : series.posterUrl ? (
                        <img
                            src={series.posterUrl}
                            alt={series.title}
                            className="w-full h-full object-cover blur-md scale-110 opacity-50"
                        />
                    ) : null}

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,var(--color-background)_0%,transparent_50%)] z-10 opacity-90" />
                    <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/20 z-10" />
                </div>

                <button
                    onClick={handleGoBack}
                    className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all z-30 cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
                    <div className="max-w-4xl space-y-6">
                        <div className="flex flex-wrap text-shadow-2xs text-shadow-black items-center gap-4 text-sm font-medium">
                            {series.rating && (
                                <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-3xl border border-yellow-500/20">
                                    <Star size={15} fill="currentColor" />
                                    <span>{series.rating}</span>
                                </div>
                            )}
                            {releaseYear && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Calendar size={16} />
                                    <span>{releaseYear}</span>
                                </div>
                            )}
                            {series.status && (
                                <span className="px-2 py-0.5 border border-white/20 rounded-xl text-[10px] uppercase tracking-widest text-white/40">
                                    {series.status.replace('_', ' ')}
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white text-shadow-2xs text-shadow-black tracking-tight leading-none">
                            {series.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <WatchlistButton onClick={handleToWatchlist} isActive={series.inUserLibrary ?? false} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid Section */}
            <div className="mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-12">
                    <VideoOverview title={'Series Overview'} overview={series.overview} />

                    {!!series.genres.length && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Genres</h3>
                            <div className="flex flex-wrap gap-3">
                                {series.genres?.map((genre) => (
                                    <span
                                        onClick={() => handleGenreClick(genre)}
                                        key={genre.id}
                                        className="group relative px-5 py-2 bg-white/3 border border-white/10 rounded-3xl text-sm font-medium text-text/70 transition-all duration-300 hover:border-primary/50 hover:text-primary cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative z-10 uppercase tracking-wider text-[12px]">{genre.name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Seasons Sidebar */}
                <div className="space-y-8 h-fit">
                    <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-4 flex items-center gap-2">
                            <Layers size={14} />
                            All Seasons ({series.seasons?.length || 0})
                        </h3>

                        <div className="flex flex-col gap-3">
                            {series.seasons
                                ?.sort((a, b) => a.seasonNumber - b.seasonNumber)
                                .map((season) => (
                                    <div
                                        key={season.id}
                                        onClick={() => openSeasonDetails(season.id)}
                                        className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-3xl p-3 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <div className="w-12 h-16 bg-white/10 rounded-xl overflow-hidden shrink-0">
                                            {season.posterUrl ? (
                                                <img
                                                    src={season.posterUrl}
                                                    alt={season.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-xs">
                                                    S{season.seasonNumber}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">
                                                {season.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {season.episodeCount !== undefined && (
                                                    <span className="text-[10px] font-medium text-white/40">{season.episodeCount} Eps</span>
                                                )}
                                                {season.airDate && (
                                                    <>
                                                        <span className="text-white/20 text-[10px]">•</span>
                                                        <span className="text-[10px] text-white/40">
                                                            {new Date(season.airDate).getFullYear()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {(!series.seasons || series.seasons.length === 0) && (
                                <p className="text-xs text-white/30">No seasons available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
