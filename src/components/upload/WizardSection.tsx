import { Check, ChevronRight, type LucideIcon } from 'lucide-react';

type WizardOptionType = 'info' | 'warn' | 'danger';

export function StepIndicator({
    currentStep,
    steps = ['Type', 'Source', 'Input', 'Metadata'],
    onStepClick,
    disabled = false,
}: {
    currentStep: number;
    steps?: string[];
    onStepClick?: (step: number) => unknown;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-1 items-center justify-center px-1">
            {steps.map((step, index) => {
                const complete = index < currentStep;
                const active = index === currentStep;
                const canNavigate = complete && !disabled && onStepClick;

                return (
                    <div key={step} className="flex items-center flex-1 min-w-0">
                        {index > 0 && <div className="hidden sm:block h-px flex-1 bg-white/8" />}

                        <button
                            type="button"
                            onClick={() => onStepClick?.(index)}
                            disabled={!canNavigate}
                            title={canNavigate ? `Back to ${step}` : undefined}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                                canNavigate ? 'cursor-pointer hover:bg-white/4' : 'cursor-default'
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                    complete
                                        ? 'bg-primary border-primary text-black'
                                        : active
                                          ? 'border-primary/70 text-primary bg-primary/10'
                                          : 'border-white/8 text-text/25 bg-white/3'
                                }`}
                            >
                                {complete ? (
                                    <Check size={14} strokeWidth={3} />
                                ) : (
                                    <span className="text-[10px] font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-[11px] font-medium truncate ${active ? 'text-text/75' : 'text-text/30'}`}>{step}</span>
                        </button>
                        {index < steps.length - 1 && <div className="hidden sm:block h-px flex-1 bg-white/8" />}
                    </div>
                );
            })}
        </div>
    );
}

export function WizardSection({
    label,
    desc,
    trailing,
    children,
}: {
    label: string;
    desc?: string;
    trailing?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="my-2">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text/45 px-1">{label}</p>
                    {desc && <p className="text-[12px] text-text/30 px-1">{desc}</p>}
                </div>
                {trailing}
            </div>
            <ul className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-text/6">{children}</ul>
        </section>
    );
}

export function WizardOption({
    icon: Icon,
    label,
    value,
    onClick,
    selected = false,
    disabled = false,
    type = 'info',
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    onClick?: () => unknown;
    selected?: boolean;
    disabled?: boolean;
    type?: WizardOptionType;
}) {
    const colorScheme = getRowColorScheme(type, selected);

    return (
        <li>
            <button
                type="button"
                className={`group w-full flex items-center gap-4 px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 text-left ${
                    disabled ? 'opacity-45 cursor-not-allowed' : selected ? 'bg-white/6 cursor-pointer' : 'hover:bg-white/4 cursor-pointer'
                }`}
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
            >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorScheme.iconBg}`}>
                    <Icon size={16} className={`${colorScheme.icon} ${type === 'info' && !disabled ? 'group-hover:text-primary' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colorScheme.title}`}>{label}</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{value}</p>
                </div>
                {!disabled && <ChevronRight size={16} className="text-white/25 transition-colors shrink-0 group-hover:text-primary" />}
            </button>
        </li>
    );
}

const getRowColorScheme = (type: WizardOptionType, selected: boolean) => {
    if (type === 'danger') {
        return {
            icon: 'text-red-400',
            iconBg: 'bg-red-500/10',
            title: 'text-red-400',
        };
    }

    if (type === 'warn') {
        return {
            icon: 'text-amber-300',
            iconBg: 'bg-amber-500/10',
            title: 'text-amber-400',
        };
    }

    return {
        icon: selected ? 'text-primary' : 'text-text/75',
        iconBg: selected ? 'bg-primary/10' : 'bg-text/5',
        title: selected ? 'text-primary' : 'text-text/85',
    };
};
