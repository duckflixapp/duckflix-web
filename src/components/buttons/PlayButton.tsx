import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlayButton({ videoId, title }: { videoId: string; title?: string | null }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(`/watch/${videoId}`)}
            className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-primary hover:bg-primary/90 text-background font-bold rounded-4xl transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
        >
            <Play size={20} fill="currentColor" />
            <span className="uppercase">{title ?? 'Play Now'}</span>
        </button>
    );
}
