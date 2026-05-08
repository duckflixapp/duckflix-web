import { Cpu, ChevronDown } from 'lucide-react';

export type ProcessorId = 'uploader' | 'torrent';

const PROCESSORS: { id: ProcessorId; label: string }[] = [
    { id: 'uploader', label: 'Uploader' },
    { id: 'torrent', label: 'Torrent' },
];

export function ProcessorSelect({
    value,
    onChange,
    disabled = false,
}: {
    value: ProcessorId;
    onChange: (value: ProcessorId) => unknown;
    disabled?: boolean;
}) {
    return (
        <div className="relative shrink-0">
            <Cpu size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text/35" />
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as ProcessorId)}
                disabled={disabled}
                title="Processor"
                className="h-8 rounded-2xl border border-white/8 bg-white/3 pl-8 pr-8 text-[11px] font-medium text-text/55 outline-none transition-colors hover:bg-white/4 hover:text-text/80 focus:border-primary/40 focus:text-text/85 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer appearance-none"
            >
                {PROCESSORS.map((processor) => (
                    <option key={processor.id} value={processor.id}>
                        {processor.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text/30" />
        </div>
    );
}
