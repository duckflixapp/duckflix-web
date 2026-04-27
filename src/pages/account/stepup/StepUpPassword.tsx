import { type Dispatch, type SetStateAction } from 'react';
import { KeyRound } from 'lucide-react';

interface StepUpPasswordProps {
    credential: string;
    setCredential: Dispatch<SetStateAction<string>>;
    error: string | null;
    onSubmit?: () => unknown;
}

export function StepUpPassword({ credential, setCredential, error, onSubmit: handleSubmit }: StepUpPasswordProps) {
    return (
        <div className="flex flex-col gap-y-6">
            <div className="flex flex-col divide-y divide-white/6">
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <KeyRound size={15} className="text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/35">Method</p>
                        <p className="text-sm font-semibold text-white/85 mt-0.5">Password</p>
                    </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={credential}
                        onChange={(e) => setCredential(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit?.()}
                        className="outline-0 text-sm"
                        autoFocus
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>
            </div>
        </div>
    );
}
