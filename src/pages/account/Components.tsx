import { ChevronRight, type LucideIcon } from 'lucide-react';

export function Section({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="my-2">
            <div className="flex flex-col gap-1 mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text/45 px-1">{label}</p>
                {desc && <p className="text-[12px] text-text/30 px-1">{desc}</p>}
            </div>
            <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-text/6">{children}</div>
        </div>
    );
}

export function Header({ title }: { title: string }) {
    return (
        <div className="flex w-full justify-center items-center pt-4">
            <h1 className="text-text text-2xl">{title}</h1>
        </div>
    );
}

interface ListRowProps {
    type: 'info' | 'warn' | 'danger';
    icon: LucideIcon;
    label: string;
    value: string;
    last?: boolean;
    trailing?: React.ReactNode;
}

export function InfoRow({ icon: Icon, label, value, trailing }: Omit<ListRowProps, 'type'>) {
    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/5`}>
                <Icon size={15} className="text-white/50" />
            </div>
            <div className="flex-1 min-w-0 text-start">
                <p className={`text-[11px] font-medium text-white/35`}>{label}</p>
                <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
            </div>
            {trailing}
        </div>
    );
}

const rowColorScheme = {
    danger: {
        icon: 'text-red-400',
        iconBg: 'bg-red-500/10',
        title: 'text-red-400',
    },
    warn: {
        icon: 'text-amber-300',
        iconBg: 'bg-amber-500/10',
        title: 'text-amber-400',
    },
    info: {
        icon: 'text-text/50',
        iconBg: 'bg-text/5',
        title: 'text-text/85',
    },
};

export function ButtonRow({
    type,
    icon: Icon,
    label,
    value,
    last,
    onClick,
}: Omit<ListRowProps, 'trailing'> & {
    onClick?: () => unknown;
}) {
    const colorScheme = rowColorScheme[type];
    const chevronColor =
        type === 'info' ? 'group-hover:text-primary/85' : type === 'warn' ? 'group-hover:text-amber-400/50' : 'group-hover:text-red-400/50';

    return (
        <button
            type="button"
            className={`group w-full flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${last ? 'rounded-b-2xl' : ''}`}
            onClick={onClick}
        >
            <div className={`w-9 h-9 rounded-full  flex items-center justify-center shrink-0 ${colorScheme.iconBg}`}>
                <Icon size={16} className={`${colorScheme.icon} ${type == 'info' && 'group-hover:text-primary'}`} />
            </div>
            <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium ${colorScheme.title}`}>{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{value}</p>
            </div>
            {onClick != undefined && <ChevronRight size={16} className={`text-white/25 transition-colors shrink-0 ${chevronColor} `} />}
        </button>
    );
}
