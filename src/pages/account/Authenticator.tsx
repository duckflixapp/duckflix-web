// pages/account/Authenticator.tsx
import { useState } from 'react';
import { ScanQrCode, ShieldCheck } from 'lucide-react';
import { AuthenticatorScan } from './authenticator/AuthenticatorScan';
import { AuthenticatorVerify } from './authenticator/AuthenticatorVerify';
import { AuthenticatorBackup } from './authenticator/AuthenticatorBackup';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { BackButton } from '../../components/buttons/BackButton';

type Step = 'scan' | 'verify' | 'backup';

export default function Authenticator() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('scan');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [disabling, setDisabling] = useState(false);
    const { user, clearStepUp } = useAuth();

    const handleDisable = async () => {
        setDisabling(true);
        try {
            await api.delete('/account/authenticator');
            toast.success('Authenticator disabled');
            navigate('/account/settings', { replace: true });
        } catch (e) {
            if (e instanceof AxiosError && e.response?.status === 403) {
                clearStepUp();
                navigate('/account/stepup', {
                    state: { scope: 'sensitive:write', returnTo: '/account/settings/authenticator' },
                    replace: true,
                });
            } else toast.error('Failed to disable authenticator.');
        } finally {
            setDisabling(false);
        }
    };

    const handleCancel = async () => {
        await api.delete<void>('/account/authenticator/setup').catch(() => null);
        navigate('/account/settings');
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/settings" label="Settings" />
            {user?.isTotpEnabled ? (
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">Authenticator</p>
                    <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-white/6">
                        <div className="flex items-center gap-4 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <ShieldCheck size={15} className="text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white/85">Authenticator App</p>
                                <p className="text-xs text-white/40 mt-0.5">Your account is protected with TOTP</p>
                            </div>
                            <button
                                onClick={handleDisable}
                                disabled={disabling}
                                className="flex items-center justify-center px-4 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/8 hover:bg-red-500/12 transition-colors text-xs text-red-400 cursor-pointer"
                            >
                                {disabling ? 'Disabling...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">Setup</p>
                    <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-white/6">
                        {/* Title row */}
                        <div className="flex items-center gap-4 px-5 py-4">
                            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                <ScanQrCode size={15} className="text-white/50" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white/85">Authenticator App</p>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {step === 'scan' && 'Scan the QR code with your authenticator app'}
                                    {step === 'verify' && 'Enter the 6-digit code from your app'}
                                    {step === 'backup' && 'Save your backup codes'}
                                </p>
                            </div>
                            {/* Step indicator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {(['scan', 'verify', 'backup'] as Step[]).map((s, i) => (
                                    <div
                                        key={s}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            step === s
                                                ? 'w-4 bg-primary'
                                                : ['scan', 'verify', 'backup'].indexOf(step) > i
                                                  ? 'w-1.5 bg-primary/40'
                                                  : 'w-1.5 bg-white/10'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {step === 'scan' && <AuthenticatorScan onNext={() => setStep('verify')} />}
                        {step === 'verify' && (
                            <AuthenticatorVerify
                                onBack={() => setStep('scan')}
                                onSuccess={(codes) => {
                                    setBackupCodes(codes);
                                    setStep('backup');
                                }}
                            />
                        )}
                        {step === 'backup' && (
                            <AuthenticatorBackup codes={backupCodes} onDone={() => navigate('/account/settings', { replace: true })} />
                        )}
                    </div>

                    <div className="px-1 py-4">
                        <button onClick={handleCancel} className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
