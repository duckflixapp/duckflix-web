import { ChevronLeft, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VideoNotFound() {
    const navigate = useNavigate();
    return (
        <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="p-4 bg-white/5 rounded-full border border-white/10">
                <Film size={32} className="text-[#ccc]" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-white">Video not found</h1>
                <p className="text-white/40 text-sm">This video doesn't exist or has been deleted.</p>
            </div>
            <button
                onClick={() => navigate('/browse')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-3xl transition-all cursor-pointer"
            >
                <ChevronLeft size={16} />
                Back to Browse
            </button>
        </div>
    );
}
