import { Film } from 'lucide-react';

export function CatalogEmptyState({ title, description, onClear }: { title: string; description: string; onClear?: () => void }) {
    return (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-primary">
                <Film size={42} />
            </div>
            <div className="max-w-md space-y-2">
                <h3 className="text-2xl font-bold text-text">{title}</h3>
                <p className="text-sm leading-6 text-text/40">{description}</p>
            </div>
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-2 rounded-4xl bg-primary px-6 py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 cursor-pointer"
                >
                    Reset filters
                </button>
            )}
        </div>
    );
}
