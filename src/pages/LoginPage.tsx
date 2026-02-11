import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import type { UserDTO } from '@duckflix/shared';
import { useAuth } from '../hooks/use-auth';

export default function LoginPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthLoading && user) {
            navigate('/browse', { replace: true });
        }
    }, [user, isAuthLoading, navigate]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setIsLoading(true);

        try {
            await api.post('/auth/login', { email, password });
            const data = await queryClient.fetchQuery({
                queryKey: ['auth-user'],
                queryFn: async () => {
                    const { data } = await api.get<UserDTO>('/auth/me');
                    return data;
                },
            });

            if (data) {
                navigate('/browse');
            }
        } catch (err: unknown) {
            if (!axios.isAxiosError(err)) {
                setError('An unexpected error occurred');
                return;
            }
            const response = err.response?.data;

            if (response?.details && Array.isArray(response.details)) {
                const errors: Record<string, string> = {};
                response.details.forEach((d: { field: string; message: string }) => {
                    errors[d.field] = d.message;
                });
                setFieldErrors(errors);
            } else setError(response?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden font-poppins">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-110 mx-4">
                <div className="bg-secondary/10 backdrop-blur-2xl border border-white/10 px-8 py-12 rounded-3xl shadow-2xl">
                    <div className="text-center mt-3 mb-8">
                        <h1 className="text-3xl font-bold text-text tracking-tight">Welcome Back</h1>
                        <p className="text-text/50 text-sm mt-2">Log in to your Duckflix account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm animate-shake">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-text/80 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 group-focus-within:text-primary transition-colors"
                                    size={18}
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className={`w-full bg-background/50 border ${fieldErrors.email ? 'border-red-500' : 'border-white/5'} text-sm py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 ring-primary/50 transition-all text-text`}
                                    required
                                />
                            </div>
                            {fieldErrors.email && <p className="text-red-500 text-xs ml-1">{fieldErrors.email}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-text/80 ml-1">Password</label>
                            <div className="relative group">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 group-focus-within:text-primary transition-colors"
                                    size={18}
                                />
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full bg-background/50 border ${fieldErrors.password ? 'border-red-500' : 'border-white/5'} text-sm py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 ring-primary/50 transition-all text-text`}
                                    required
                                />
                            </div>
                            {fieldErrors.password && <p className="text-red-500 text-xs ml-1">{fieldErrors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-background text-sm font-medium py-3 rounded-xl transition-all transform cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
