import { ChevronRight, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { VideoMinDTO } from '@duckflixapp/shared';

export interface UploadedVideo extends VideoMinDTO {
    title: string;
    overview: string;
}

export function UploadedVideosList({ videos }: { videos: UploadedVideo[] }) {
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl w-full mx-auto px-10 py-6 md:px-16 md:py-10 pb-20 flex flex-col gap-y-8 text-white">
            <section className="my-2">
                <div className="flex flex-col gap-1 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text/45 px-1">Uploaded Videos</p>
                </div>

                <ul className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-text/6">
                    {videos.map((video) => (
                        <li key={video.id}>
                            <button
                                type="button"
                                title="Open video"
                                onClick={() => navigate(`/details/${video.id}`)}
                                className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2"
                            >
                                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                    <Film size={16} className="text-text/50 group-hover:text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-white/85 truncate">{video.title}</p>
                                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-2">{video.overview}</p>
                                </div>
                                <ChevronRight size={16} className="text-white/25 transition-colors shrink-0 group-hover:text-primary" />
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
