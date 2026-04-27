import { useQuery } from '@tanstack/react-query';
import { StepUpPassword } from './StepUpPassword';
import { api } from '../../../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { StepUpTotp } from './StepUpTotp';

type StepUpMethod = 'password' | 'totp';

export default function StepUp() {
    const { state } = useLocation();
    const scope = state?.scope ?? 'sensitive:write';
    const returnTo = state?.returnTo ?? '/account/settings';
    const navigate = useNavigate();
    const { applyStepUp } = useAuth();
    const [method, setMethod] = useState<null | string>(null);

    // credential states
    const [passsword, setPassword] = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<null | string>(null);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const credential = useMemo(() => {
        if (method === 'password') return passsword;
        if (method === 'totp') return code.join('');
        return '';
    }, [passsword, code, method]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['step-up-methods'],
        queryFn: () => api.get<{ methods: StepUpMethod[] }>('/auth/step-up/methods'),
    });

    useEffect(() => {
        const methods = data?.methods;
        if (!methods) return;
        setMethod(methods[1]);
    }, [data?.methods]);

    const handleSubmit = async () => {
        if (!credential) return;
        setLoading(true);
        setError(null);
        try {
            const { token, expiresIn } = await api.post<{ token: string; expiresIn: number }>('/auth/step-up', {
                scope,
                method,
                credential,
            });
            applyStepUp(token, expiresIn);
            navigate(returnTo, { replace: true });
        } catch {
            const valueType = method === 'totp' ? 'code' : method;
            setError(`Incorrect ${valueType}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/account/settings');
    };

    const disabled = loading || !credential.length;

    return (
        <div className="max-w-6xl w-full mx-auto p-6 md:p-12 pb-20 flex flex-col xl:pr-56 gap-y-8">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-full max-w-sm flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <ShieldCheck size={20} className="text-white/60" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Verify your identity</h1>
                            <p className="text-xs text-white/40 mt-1">Confirm your identity to continue</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-white/8 bg-white/3 overflow-hidden">
                            {isLoading && (
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-xs text-white/30">Finding verification methods for you...</p>
                                </div>
                            )}
                            {isError && (
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-xs text-red-400">Failed to load verification methods.</p>
                                </div>
                            )}
                            {method === 'password' && (
                                <StepUpPassword credential={passsword} setCredential={setPassword} error={error} onSubmit={handleSubmit} />
                            )}
                            {method === 'totp' && <StepUpTotp value={code} onChange={setCode} error={error} onSubmit={handleSubmit} />}
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleCancel}
                                title="Cancel"
                                className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                title="Continue"
                                onClick={handleSubmit}
                                disabled={disabled}
                                className={`px-6 py-2 rounded-3xl text-sm text-background font-medium ${!disabled ? 'cursor-pointer bg-primary' : 'bg-primary/75'}`}
                            >
                                {loading ? 'Verifying...' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
