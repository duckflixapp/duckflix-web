import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, KeyRound, Loader2, Lock, Mail, ShieldCheck, TicketCheck } from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchCurrentAccount, selectProfile } from '../lib/account';
import type { AccountDTO } from '@duckflixapp/shared';

type LoginStep = 'credentials' | 'two-factor';
type LoginTwoFactorMethod = 'totp' | 'backup_code';

interface LoginTwoFactorChallenge {
    challengeToken: string;
    expiresIn: number;
    methods: LoginTwoFactorMethod[];
}

interface ActiveChallenge extends LoginTwoFactorChallenge {
    expiresAt: number;
}

interface LoginSuccess {
    status: 'success';
    user: AccountDTO;
}

const isTwoFactorChallenge = (value: unknown): value is LoginTwoFactorChallenge => {
    if (!value || typeof value !== 'object') return false;
    const challenge = value as Partial<LoginTwoFactorChallenge>;
    return typeof challenge.challengeToken === 'string' && Array.isArray(challenge.methods);
};

const isLoginSuccess = (value: unknown): value is LoginSuccess => {
    if (!value || typeof value !== 'object') return false;
    const result = value as Partial<LoginSuccess>;
    return result.status === 'success' && !!result.user;
};

const getErrorMessage = (err: unknown, fallback: string) => {
    if (!axios.isAxiosError(err)) return fallback;
    const response = err.response?.data;
    return response?.message ?? fallback;
};

const formatRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

export default function LoginPage() {
    const auth = useAuthContext();
    const [step, setStep] = useState<LoginStep>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [backupCode, setBackupCode] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<LoginTwoFactorMethod>('totp');
    const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loadingStep, setLoadingStep] = useState<LoginStep | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const redirectTo = useMemo(() => {
        const state = location.state as { from?: { pathname?: string; search?: string } } | null;
        const from = state?.from;
        if (!from?.pathname || from.pathname === '/login') return '/browse';
        return `${from.pathname}${from.search ?? ''}`;
    }, [location.state]);

    useEffect(() => {
        if (auth && !auth.isLoading && auth.user) {
            navigate('/browse', { replace: true });
        }
    }, [auth, navigate]);

    useEffect(() => {
        if (step !== 'two-factor' || !challenge) return;

        const updateRemaining = () => {
            setRemainingSeconds(Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000)));
        };

        updateRemaining();
        const timer = window.setInterval(updateRemaining, 1000);
        return () => window.clearInterval(timer);
    }, [challenge, step]);

    if (auth && auth.isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const finishLogin = async (loginUser?: AccountDTO) => {
        if (loginUser?.profile && loginUser.isVerified) {
            await selectProfile(loginUser.profile.id);
        }

        const user = loginUser && !loginUser.isVerified ? loginUser : await fetchCurrentAccount();
        queryClient.setQueryData(['auth-user'], user);
        navigate(redirectTo, { replace: true });
    };

    const setServerFieldErrors = (err: unknown) => {
        if (!axios.isAxiosError(err)) return false;

        const response = err.response?.data;
        if (!response?.details || !Array.isArray(response.details)) return false;

        const errors: Record<string, string> = {};
        response.details.forEach((detail: { field?: string; message?: string }) => {
            if (detail.field && detail.message) errors[detail.field] = detail.message;
        });
        setFieldErrors(errors);
        return Object.keys(errors).length > 0;
    };

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTwoFactorError(null);
        setFieldErrors({});
        setLoadingStep('credentials');

        try {
            const result = await api.post<LoginTwoFactorChallenge | LoginSuccess | undefined>('/auth/login', {
                email: email.trim(),
                password,
            });

            if (isTwoFactorChallenge(result)) {
                const method = result.methods.includes('totp') ? 'totp' : result.methods[0];
                setChallenge({ ...result, expiresAt: Date.now() + result.expiresIn });
                setSelectedMethod(method);
                setCode(['', '', '', '', '', '']);
                setBackupCode('');
                setPassword('');
                setStep('two-factor');
                return;
            }

            await finishLogin(isLoginSuccess(result) ? result.user : undefined);
        } catch (err: unknown) {
            if (!setServerFieldErrors(err)) {
                setError(getErrorMessage(err, 'Unable to sign in. Please check your details and try again.'));
            }
        } finally {
            setLoadingStep(null);
        }
    };

    const handleTwoFactorSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!challenge || loadingStep) return;

        const credential = selectedMethod === 'totp' ? code.join('') : backupCode.trim();
        if (!credential || remainingSeconds <= 0) return;

        setTwoFactorError(null);
        setLoadingStep('two-factor');

        try {
            const result = await api.post<LoginSuccess>('/auth/login/verify-2fa', {
                challengeToken: challenge.challengeToken,
                method: selectedMethod,
                credential,
            });

            await finishLogin(isLoginSuccess(result) ? result.user : undefined);
        } catch (err: unknown) {
            setTwoFactorError(getErrorMessage(err, 'Invalid authentication code. Please try again.'));
        } finally {
            setLoadingStep(null);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setChallenge(null);
        setTwoFactorError(null);
        setCode(['', '', '', '', '', '']);
        setBackupCode('');
    };

    const isCredentialsLoading = loadingStep === 'credentials';
    const isTwoFactorLoading = loadingStep === 'two-factor';
    const canUseTotp = challenge?.methods.includes('totp') ?? false;
    const canUseBackup = challenge?.methods.includes('backup_code') ?? false;
    const twoFactorCredential = selectedMethod === 'totp' ? code.join('') : backupCode.trim();
    const twoFactorDisabled =
        isTwoFactorLoading ||
        remainingSeconds <= 0 ||
        (selectedMethod === 'totp' ? twoFactorCredential.length !== 6 : twoFactorCredential.length !== 8);

    return (
        <div className="relative min-h-screen w-full bg-background text-text overflow-hidden font-poppins">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(181,200,255,0.20),transparent_30%),radial-gradient(circle_at_86%_82%,rgba(113,205,113,0.14),transparent_28%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

            <main className="relative flex min-h-screen w-full items-center justify-center px-5 py-10">
                <section className="w-full max-w-110">
                    <div className="w-full">
                        <div className="rounded-[34px] border border-white/10 bg-secondary/10 px-6 py-7 shadow-2xl backdrop-blur-2xl sm:px-8 sm:py-9">
                            <div className="mb-7 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Duckflix</p>
                                    <h2 className="mt-2 text-3xl font-bold tracking-tight">
                                        {step === 'credentials' ? 'Welcome back' : 'Verify it is you'}
                                    </h2>
                                    <p className="mt-2 text-sm text-white/45">
                                        {step === 'credentials'
                                            ? 'Use your account email and password.'
                                            : `Enter a second factor for ${email.trim()}.`}
                                    </p>
                                </div>
                                {step === 'two-factor' && (
                                    <button
                                        type="button"
                                        onClick={handleBackToCredentials}
                                        className="mt-1 rounded-full border border-white/10 bg-white/5 p-2 text-white/45 transition-colors hover:text-white cursor-pointer"
                                        title="Back to password"
                                    >
                                        <ArrowLeft size={17} />
                                    </button>
                                )}
                            </div>

                            {step === 'credentials' ? (
                                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                                    {error && (
                                        <div className="flex items-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-shake">
                                            <AlertCircle size={18} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <FieldShell label="Email Address" error={fieldErrors.email}>
                                        <Mail
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 transition-colors group-focus-within:text-primary"
                                            size={18}
                                        />
                                        <input
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className={`w-full rounded-3xl border bg-background/50 py-3 pl-12 pr-4 text-sm text-text outline-none transition-all focus:ring-2 ring-primary/50 ${
                                                fieldErrors.email ? 'border-red-500' : 'border-white/5'
                                            }`}
                                            autoComplete="email"
                                            required
                                        />
                                    </FieldShell>

                                    <FieldShell label="Password" error={fieldErrors.password}>
                                        <Lock
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 transition-colors group-focus-within:text-primary"
                                            size={18}
                                        />
                                        <input
                                            type="password"
                                            name="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={`w-full rounded-3xl border bg-background/50 py-3 pl-12 pr-4 text-sm text-text outline-none transition-all focus:ring-2 ring-primary/50 ${
                                                fieldErrors.password ? 'border-red-500' : 'border-white/5'
                                            }`}
                                            autoComplete="current-password"
                                            required
                                        />
                                    </FieldShell>

                                    <button
                                        type="submit"
                                        disabled={isCredentialsLoading}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl bg-primary py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isCredentialsLoading ? <Loader2 className="animate-spin" size={19} /> : 'Continue'}
                                    </button>

                                    <p className="pt-1 text-center text-sm text-text/50">
                                        Don't have an account?&ensp;
                                        <button
                                            type="button"
                                            className="cursor-pointer font-medium text-primary hover:underline"
                                            onClick={() => navigate('/register')}
                                        >
                                            Register
                                        </button>
                                    </p>
                                </form>
                            ) : (
                                <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
                                    <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white/85">Two-factor required</p>
                                                    <p className="mt-0.5 text-xs text-white/35">
                                                        Challenge expires in {formatRemaining(remainingSeconds)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-2 w-2 mx-2 rounded-full bg-accent shadow-[0_0_20px_rgba(113,205,113,0.65)]" />
                                        </div>
                                    </div>

                                    {canUseBackup && (
                                        <div className="grid grid-cols-2 gap-2 rounded-3xl bg-background/45 p-1.5">
                                            {canUseTotp && (
                                                <MethodButton
                                                    active={selectedMethod === 'totp'}
                                                    icon={<KeyRound size={15} />}
                                                    label="Authenticator"
                                                    onClick={() => {
                                                        setSelectedMethod('totp');
                                                        setTwoFactorError(null);
                                                    }}
                                                />
                                            )}
                                            <MethodButton
                                                active={selectedMethod === 'backup_code'}
                                                icon={<TicketCheck size={15} />}
                                                label="Backup code"
                                                onClick={() => {
                                                    setSelectedMethod('backup_code');
                                                    setTwoFactorError(null);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {selectedMethod === 'totp' ? (
                                        <TotpInput value={code} onChange={setCode} disabled={isTwoFactorLoading || remainingSeconds <= 0} />
                                    ) : (
                                        <FieldShell label="Backup Code" error={null}>
                                            <TicketCheck
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 transition-colors group-focus-within:text-primary"
                                                size={18}
                                            />
                                            <input
                                                type="text"
                                                value={backupCode}
                                                onChange={(e) =>
                                                    setBackupCode(
                                                        e.target.value
                                                            .toUpperCase()
                                                            .replace(/[^A-F0-9]/g, '')
                                                            .slice(0, 8)
                                                    )
                                                }
                                                placeholder="A1B2C3D4"
                                                className="w-full rounded-3xl border border-white/5 bg-background/50 py-3 pl-12 pr-4 font-mono text-sm tracking-widest text-text outline-none transition-all focus:ring-2 ring-primary/50"
                                                autoComplete="one-time-code"
                                                disabled={isTwoFactorLoading || remainingSeconds <= 0}
                                            />
                                        </FieldShell>
                                    )}

                                    {twoFactorError && (
                                        <div className="flex items-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-shake">
                                            <AlertCircle size={18} className="shrink-0" />
                                            <span>{twoFactorError}</span>
                                        </div>
                                    )}

                                    {remainingSeconds <= 0 && (
                                        <p className="rounded-3xl border border-amber-400/15 bg-amber-500/8 px-4 py-3 text-xs text-amber-300/80">
                                            This login challenge expired. Go back and enter your password again.
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={twoFactorDisabled}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl bg-primary py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isTwoFactorLoading ? <Loader2 className="animate-spin" size={19} /> : 'Sign in'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FieldShell({ label, error, children }: { label: string; error: string | null | undefined; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-xs font-medium text-text/80">{label}</label>
            <div className="relative group">{children}</div>
            {error && <p className="ml-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function MethodButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-3xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                active ? 'bg-primary text-background' : 'text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function TotpInput({ value, onChange, disabled }: { value: string[]; onChange: (value: string[]) => void; disabled: boolean }) {
    const handleChange = (nextValue: string) => {
        if (disabled) return;
        const digits = nextValue.replace(/\D/g, '').slice(0, value.length);
        onChange(value.map((_, index) => digits[index] ?? ''));
    };

    return (
        <FieldShell label="Authenticator Code" error={null}>
            <KeyRound
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 transition-colors group-focus-within:text-primary"
                size={18}
            />
            <input
                type="text"
                inputMode="numeric"
                value={value.join('')}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="123456"
                className="w-full rounded-3xl border border-white/5 bg-background/50 py-3 pl-12 pr-4 font-mono text-sm tracking-widest text-text outline-none transition-all focus:ring-2 ring-primary/50"
                autoComplete="one-time-code"
                autoFocus
                disabled={disabled}
            />
        </FieldShell>
    );
}
