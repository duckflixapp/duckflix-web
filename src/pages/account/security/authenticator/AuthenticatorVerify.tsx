import { useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/use-auth';
import { api } from '../../../../lib/api';

interface Props {
    onBack: () => void;
    onSuccess: (backupCodes: string[]) => void;
}

export function AuthenticatorVerify({ onBack, onSuccess }: Props) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const { clearStepUp } = useAuth();

    const fullCode = code.join('');
    const canSubmit = fullCode.length === 6 && !loading;

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...code];
        next[index] = value.slice(-1);
        setCode(next);
        if (value && index < 5) inputs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...code];
        pasted.split('').forEach((char, i) => {
            next[i] = char;
        });
        setCode(next);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError(null);
        try {
            const { backupCodes } = await api.post<{ backupCodes: string[] }>('/account/authenticator/setup', {
                code: fullCode,
            });
            onSuccess(backupCodes);
        } catch (e) {
            if (e instanceof AxiosError && e.response?.status === 400) {
                setError('Invalid code. Please try again.');
            } else if (e instanceof AxiosError && e.response?.status === 403) {
                clearStepUp();
                navigate('/account/stepup', {
                    state: { scope: 'sensitive:write', returnTo: '/account/security/authenticator' },
                    replace: true,
                });
            } else {
                setError('Something went wrong. Please try again.');
            }
            setCode(['', '', '', '', '', '']);
            inputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="divide-y divide-white/6">
            <div className="p-5 flex flex-col items-center gap-5">
                {/* 6-digit input */}
                <div className="flex items-center gap-2" onPaste={handlePaste}>
                    {code.map((digit, i) => (
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
                <p className="text-xs text-white/30 text-center">Open your authenticator app and enter the 6-digit code</p>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-2 rounded-3xl text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`px-6 py-2 rounded-3xl text-sm font-medium text-background transition-colors ${canSubmit ? 'bg-primary cursor-pointer' : 'bg-primary/50'}`}
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>
            </div>
        </div>
    );
}
