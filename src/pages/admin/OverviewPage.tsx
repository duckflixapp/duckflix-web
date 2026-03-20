import { HardDrive, Loader2, BarChart3, Server } from 'lucide-react';
import AdminSection from '../../components/admin/AdminSection';
import { useAdmin } from '../../hooks/useAdmin';

const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export default function OverviewPage() {
    const { stats: statistics, isStatsLoading: isLoading } = useAdmin();

    if (isLoading)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );

    if (!statistics) return null;

    const { storage, tasks, sessions, uptime, version } = statistics;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="text-primary" size={28} />
                    Overview
                </h1>
                <p className="text-white/40 text-sm mt-1">System statistics and resource usage.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AdminSection title="Server" icon={Server}>
                    <div className="w-full flex justify-between flex-wrap gap-x-8 gap-y-4">
                        <Stat label="Version" value={`v${version}`} />
                        <Stat label="Uptime" value={formatUptime(uptime)} />
                        <Stat label="Live Sessions" value={String(sessions.total)} />
                        <Stat
                            label="Tasks"
                            value={tasks.working > 0 ? `${tasks.working} working` : 'Idle'}
                            sub={tasks.queue > 0 ? `${tasks.queue} queued` : undefined}
                            highlight={tasks.working > 0}
                        />
                    </div>
                </AdminSection>

                <AdminSection title="Storage" icon={HardDrive}>
                    <div className="space-y-6">
                        <div className="w-full flex flex-wrap justify-between gap-x-8 gap-y-4">
                            <Stat label="Used" value={storage.used} />
                            <Stat label="Available" value={storage.available} highlight />
                            <Stat label="Total" value={storage.limit} />
                        </div>
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        storage.usedPercent > 90 ? 'bg-red-500' : storage.usedPercent > 70 ? 'bg-yellow-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${Math.min(storage.usedPercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-white/20">{storage.usedPercent}% used</p>
                        </div>
                    </div>
                </AdminSection>
            </div>
        </div>
    );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5 px-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">{label}</span>
            <span className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-white/80'}`}>{value}</span>
            {sub && <span className="text-[10px] text-white/30">{sub}</span>}
        </div>
    );
}
