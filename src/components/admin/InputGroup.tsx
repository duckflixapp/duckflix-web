import type { FieldError } from 'react-hook-form';

export default function InputGroup({
    label,
    description,
    error,
    children,
}: {
    label: string;
    description?: string;
    error?: FieldError;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5 w-full">
            <div className="flex flex-col relative">
                <div className="flex justify-between items-center">
                    <label className="text-[13px] font-bold text-text/80 tracking-tight">{label}</label>
                    {error && (
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-1 duration-200">
                            {error.message}
                        </span>
                    )}
                </div>
                {description && <span className="text-[10px] text-text/40 mt-0.5 leading-tight">{description}</span>}
            </div>
            <div>{children}</div>
        </div>
    );
}
