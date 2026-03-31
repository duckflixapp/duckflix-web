import { Bookmark } from 'lucide-react';

export default function WatchlistButton({ isActive, onClick: handleClick }: { isActive?: boolean; onClick?: () => unknown }) {
    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-3 px-8 py-4 cursor-pointer bg-white/5 text-shadow-2xs text-shadow-black hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium rounded-4xl transition-all"
        >
            <Bookmark size={20} fill={isActive ? 'white' : 'transparent'} />
            Watchlist
        </button>
    );
}
