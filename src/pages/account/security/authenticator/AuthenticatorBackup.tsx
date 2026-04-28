import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';

interface Props {
    codes: string[];
    onDone: () => void;
}

export function AuthenticatorBackup({ codes, onDone }: Props) {
    const [copied, setCopied] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(codes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="divide-y divide-white/6">
            <div className="p-5 flex flex-col gap-4">
                {/* Warning */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-400/15">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                        Save these codes somewhere safe. Each can only be used once if you lose access to your authenticator app.
                    </p>
                </div>

                {/* Codes grid */}
                <div className="grid grid-cols-2 gap-1.5">
                    {codes.map((code, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/6">
                            <span className="text-[10px] text-white/25 w-4 shrink-0">{i + 1}.</span>
                            <span className="text-xs font-mono text-white/70 tracking-wider">{code}</span>
                        </div>
                    ))}
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/7 transition-colors text-xs text-white/50 hover:text-white/70"
                >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy all codes'}
                </button>

                {/* Acknowledge checkbox */}
                <button onClick={() => setAcknowledged((v) => !v)} className="flex items-center gap-3 cursor-pointer group">
                    <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${acknowledged ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`}
                    >
                        {acknowledged && <Check size={10} className="text-background" strokeWidth={3} />}
                    </div>
                    <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors text-left">
                        I've saved my backup codes in a safe place
                    </span>
                </button>
            </div>

            <div className="px-5 py-4 flex justify-end">
                <button
                    onClick={onDone}
                    disabled={!acknowledged}
                    className={`px-6 py-2 rounded-3xl text-sm font-medium text-background transition-colors ${acknowledged ? 'bg-primary cursor-pointer' : 'bg-primary/50'}`}
                >
                    Done
                </button>
            </div>
        </div>
    );
}
