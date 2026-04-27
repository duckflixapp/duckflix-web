import { KeyRound } from 'lucide-react';
import { useRef } from 'react';

interface TotpInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    error: string | null;
    onSubmit?: () => unknown;
}

export function StepUpTotp({ value, onChange, onSubmit: handleSubmit, error }: TotpInputProps) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...value];
        next[index] = val.slice(-1);
        onChange(next);
        if (val && index < 5) inputs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        } else if (e.key === 'Enter') {
            handleSubmit?.();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...value];
        pasted.split('').forEach((char, i) => {
            next[i] = char;
        });
        onChange(next);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex flex-col gap-y-6">
            <div className="flex flex-col divide-y divide-white/6">
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <KeyRound size={15} className="text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/35">Method</p>
                        <p className="text-sm font-semibold text-white/85 mt-0.5">TOTP</p>
                    </div>
                </div>
                <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
                        {value.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => {
                                    inputs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                autoFocus={i === 0}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className={`w-10 h-12 text-center text-lg font-semibold rounded-xl border bg-white/5 text-white outline-none transition-colors
                        ${digit ? 'border-primary/60' : 'border-white/10'}
                        focus:border-primary/80 focus:bg-white/8`}
                            />
                        ))}
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>
            </div>
        </div>
    );
}
