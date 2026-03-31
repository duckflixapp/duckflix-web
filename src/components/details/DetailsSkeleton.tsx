export function DetailsSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="h-[70vh] bg-white/5 w-full" />
            <div className="p-16 space-y-4">
                <div className="h-10 bg-white/5 w-1/3 rounded-lg" />
                <div className="h-6 bg-white/5 w-1/2 rounded-lg" />
            </div>
        </div>
    );
}
