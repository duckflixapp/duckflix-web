import type { LucideIcon } from 'lucide-react';

export default function AdminSection({ title, icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
    const Icon = icon;
    return (
        <div className="bg-secondary/5 backdrop-blur-3xl border border-white/10 rounded-4xl p-6 mb-auto shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-primary">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-text/90 tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}
