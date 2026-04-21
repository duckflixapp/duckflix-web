import { Loader2 } from 'lucide-react';

export default function FullscreenLoader({ label = 'Loading Duckflix', description }: { label?: string; description?: string }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center">
            <div className="relative flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={34} />
                <div className="text-center">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/40 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}
