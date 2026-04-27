import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { api } from '../../../lib/api';
import { AxiosError } from 'axios';
import { useAuth } from '../../../hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface Props {
    onNext: () => void;
}

export function AuthenticatorScan({ onNext }: Props) {
    const [copied, setCopied] = useState(false);
    const { clearStepUp } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['authenticator-setup'],
        queryFn: async () => {
            try {
                return await api.get<{ qrCodeUrl: string; manualKey: string }>('/account/authenticator/setup');
            } catch (e) {
                if (e instanceof AxiosError && e.response?.status === 403) {
                    clearStepUp();
                    navigate('/account/stepup', {
                        state: { scope: 'account:sensitive', returnTo: '/account/settings/authenticator' },
                        replace: true,
                    });
                }
                throw e;
            }
        },
    });

    const handleCopy = () => {
        if (!data?.manualKey) return;
        navigator.clipboard.writeText(data.manualKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="divide-y divide-white/6">
            <div className="p-5 flex flex-col items-center gap-4">
                {isLoading && <div className="w-44 h-44 rounded-2xl bg-white/5 animate-pulse" />}
                {isError && <p className="text-xs text-red-400 py-8">Failed to generate QR code.</p>}
                {data && (
                    <>
                        {/* QR code */}
                        <div className="p-3 rounded-2xl bg-white">
                            <img src={data.qrCodeUrl} alt="TOTP QR Code" className="w-40 h-40" />
                        </div>
                        <p className="text-xs text-white/40 text-center">
                            Scan with iCloud Passwords, Google Authenticator, or any TOTP app
                        </p>

                        {/* Manual key */}
                        <div className="w-full flex flex-col gap-1">
                            <p className="text-[11px] font-medium text-white/35 px-1">Or enter key manually</p>
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors group"
                            >
                                <span className="text-xs font-mono text-white/60 tracking-wider truncate">{data.manualKey}</span>
                                {copied ? (
                                    <Check size={13} className="text-emerald-400 shrink-0" />
                                ) : (
                                    <Copy size={13} className="text-white/30 group-hover:text-white/50 transition-colors shrink-0" />
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="px-5 py-4 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!data}
                    className={`px-6 py-2 rounded-3xl text-sm font-medium text-background transition-colors ${data ? 'bg-primary cursor-pointer' : 'bg-primary/50'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
