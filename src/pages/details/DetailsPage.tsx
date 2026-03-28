import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Loader2 } from 'lucide-react';
import type { VideoResolved } from '@duckflix/shared';
import MovieNotFound from '../../components/movies/MovieNotFound';

export default function DetailsResolver() {
    const { id } = useParams<{ id: string }>();
    const { search } = useLocation();
    const navigate = useNavigate();
    const [notFound, setNotFound] = useState<boolean>(false);

    useEffect(() => {
        api.get<{ content: VideoResolved }>(`/videos/${id}/resolve`)
            .then(({ content }) => {
                if (content.type === 'movie') navigate(`/details/movie/${content.id}${search}`, { replace: true });
            })
            .catch(() => setNotFound(true));
    }, [id, navigate, search]);

    if (notFound) return <MovieNotFound />;

    return <Loading />;
}

const Loading = () => (
    <div className="absolute left-0 top-0 flex flex-col items-center justify-center w-screen h-screen">
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />

            <Loader2 className="animate-spin text-primary z-10" size={64} strokeWidth={1} />
        </div>
    </div>
);
