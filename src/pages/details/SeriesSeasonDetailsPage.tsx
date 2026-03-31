import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, ChevronLeft, Clock } from 'lucide-react';
import { useState } from 'react';

import { useSeasonDetailed } from '../../hooks/useSeasonDetails';
import type { EpisodeMinDTO } from '@duckflix/shared';
import VideoNotFound from '../../components/details/VideoNotFound';
import { DetailsSkeleton } from '../../components/details/DetailsSkeleton';

export default function SeasonDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showDescription, setShowDesc] = useState<boolean>(false);

    const { season, isLoading, isNotFound } = useSeasonDetailed(id);

    if (isLoading) return <DetailsSkeleton />;
    if (isNotFound) return <VideoNotFound />;
    if (!season) return null;

    const releaseYear = season.airDate ? new Date(season.airDate).getFullYear() : null;

    const handleGoBack = () => navigate(`/details/series/${season.seriesId}`);
    const handleEpisodeClick = (episodeId: string) => navigate(`/details/episode/${episodeId}`);

    return (
        <div className="min-h-screen pb-20">
            <div className="relative w-full aspect-21/9 min-h-120 overflow-hidden">
                <div className="absolute inset-0 rounded-tl-xl overflow-hidden">
                    {season.posterUrl ? (
                        <img
                            src={season.posterUrl}
                            alt={season.name}
                            className="w-full h-full object-cover blur-3xl scale-110 opacity-40"
                        />
                    ) : (
                        <div className="w-full h-full bg-primary/5" />
                    )}

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

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10 flex gap-8 items-end">
                    {season.posterUrl && (
                        <div className="hidden md:block w-48 aspect-2/3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                            <img src={season.posterUrl} alt={season.name} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="max-w-4xl space-y-4">
                        <div className="flex flex-wrap text-shadow-2xs text-shadow-black items-center gap-4 text-sm font-medium">
                            {releaseYear && (
                                <div className="flex items-center gap-1.5 text-text/60">
                                    <Calendar size={16} />
                                    <span>{releaseYear}</span>
                                </div>
                            )}
                            <span className="px-2.5 py-1 border border-white/20 rounded-2xl text-[10px] uppercase tracking-widest text-white/40">
                                Season {season.seasonNumber}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-normal text-white/65 text-shadow-2xs text-shadow-black tracking-tight leading-none">
                            {season.series.title}
                        </h2>
                        <h1 className="text-5xl md:text-7xl font-black text-white text-shadow-xs text-shadow-black tracking-tight leading-none">
                            {season.name}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="mx-auto px-8 md:px-16 mt-12 grid grid-cols-1 xl:grid-cols-3 gap-12 lg:gap-24">
                <div className="lg:col-span-2 space-y-8">
                    {season.overview && (
                        <div className="mb-10">
                            <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Season Overview</h3>
                            <p
                                onClick={() => setShowDesc((prev) => !prev)}
                                className={`text-text/70 w-full text-sm leading-relaxed cursor-pointer ${!showDescription && 'line-clamp-3'}`}
                            >
                                {season.overview}
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm uppercase tracking-[0.2em] text-white/30 font-bold mb-6 flex items-center gap-2">
                            Episodes ({season.episodes?.length || 0})
                        </h3>

                        <div className="flex flex-col gap-4">
                            {season.episodes
                                ?.sort((a, b) => a.episodeNumber - b.episodeNumber)
                                .map((episode) => (
                                    <Episode key={episode.id} episode={episode} onClick={() => handleEpisodeClick(episode.id)} />
                                ))}

                            {(!season.episodes || season.episodes.length === 0) && (
                                <div className="text-center py-12 bg-white/3 border border-white/5 rounded-2xl">
                                    <p className="text-sm text-white/30">No episodes available for this season yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8 h-fit max-w-md">
                    <div className="bg-white/3 border border-white/5 rounded-4xl p-6">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Season Info</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Total Episodes</p>
                                <p className="text-sm font-medium text-white/90">{season.episodes?.length || 0}</p>
                            </div>
                            {season.airDate && (
                                <div>
                                    <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Premiere Date</p>
                                    <p className="text-sm font-medium text-white/90">{new Date(season.airDate).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Episode({ episode, onClick: handleClick }: { episode: EpisodeMinDTO; onClick: () => unknown }) {
    return (
        <div
            onClick={handleClick}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white/3 border border-white/5 rounded-4xl p-3 sm:p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group"
        >
            {/* Thumbnail */}
            <div className="w-full sm:w-48 aspect-video bg-black/40 rounded-2xl overflow-hidden shrink-0 relative flex items-center justify-center">
                {episode.stillUrl ? (
                    <img
                        src={episode.stillUrl}
                        alt={episode.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <span className="text-white/20 text-xs font-bold uppercase tracking-wider">No Image</span>
                )}
            </div>

            {/* Episode Info */}
            <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-base sm:text-lg font-bold text-white/90 group-hover:text-white transition-colors leading-tight">
                        {episode.episodeNumber}. {episode.name}
                    </h4>

                    {episode.rating && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-500 bg-yellow-500/10 mr-1 px-2.5 py-1 rounded-2xl border border-yellow-500/20 shrink-0">
                            <Star size={12} fill="currentColor" />
                            <span>{episode.rating}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    {episode.runtime && (
                        <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-medium">
                            <Clock size={12} />
                            <span>{episode.runtime} min</span>
                        </div>
                    )}
                    {episode.airDate && (
                        <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-medium">
                            <Calendar size={12} />
                            <span>{new Date(episode.airDate).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
