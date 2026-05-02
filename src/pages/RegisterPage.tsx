import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import axios from 'axios';
import type { AccountMeDTO } from '../hooks/useAccount';

const registerSchema = z.object({
    email: z.email('Invalid email address').toLowerCase().trim(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(64, 'Password must be less than 65 characters')
        .regex(/[a-z]/, 'Must contain one lowercase letter')
        .regex(/[A-Z]/, 'Must contain one uppercase letter')
        .regex(/[^a-zA-Z0-9]/, 'Must contain one special character'),
});

type RegisterFields = z.infer<typeof registerSchema>;
type RegisterResult = {
    status: string;
    user: AccountMeDTO;
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
        mode: 'onTouched',
    });

    const mutation = useMutation({
        mutationFn: (data: RegisterFields) => api.post<RegisterResult>('/auth/register', data),
        onSuccess: (result) => {
            queryClient.setQueryData(['account', 'me'], result.user);
            queryClient.setQueryData(['profile', 'me'], null);
            toast.success('Account created. Set up your profile next.');
            navigate('/select-profile', { replace: true });
        },
        onError: (err: unknown) => {
            if (axios.isAxiosError(err)) {
                setServerError(err.response?.data?.message || 'Registration failed');
            } else {
                setServerError('An unexpected error occurred');
            }
        },
    });

    const onSubmit = (data: RegisterFields) => {
        setServerError(null);
        mutation.mutate(data);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden font-poppins">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-110 mx-4">
                <div className="bg-secondary/10 backdrop-blur-2xl border border-white/10 px-8 py-10 rounded-[42px] shadow-2xl">
                    <div className="text-center mt-3 mb-8">
                        <h1 className="text-3xl font-bold text-text tracking-tight">Create Account</h1>
                        <p className="text-text/50 text-sm mt-2">Join the Duckflix streaming</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {serverError && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-3xl text-sm">
                                <AlertCircle size={18} />
                                {serverError}
                            </div>
                        )}

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-text/80 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 group-focus-within:text-primary transition-colors"
                                    size={18}
                                />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="john@example.com"
                                    className={`w-full bg-background/50 border ${errors.email ? 'border-red-500' : 'border-white/5'} text-sm py-3 pl-12 pr-4 rounded-3xl outline-none focus:ring-2 ring-primary/50 transition-all text-text`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-[10px] ml-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-text/80 ml-1">Password</label>
                            <div className="relative group">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 group-focus-within:text-primary transition-colors"
                                    size={18}
                                />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className={`w-full bg-background/50 border ${errors.password ? 'border-red-500' : 'border-white/5'} text-sm py-3 pl-12 pr-4 rounded-3xl outline-none focus:ring-2 ring-primary/50 transition-all text-text`}
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-[10px] ml-1 leading-tight">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-background text-sm font-medium py-3 rounded-3xl transition-all transform cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
                        </button>

                        <p className="text-center text-text/50 text-sm mt-4">
                            Already have an account?&ensp;
                            <span className="text-primary cursor-pointer hover:underline font-medium" onClick={() => navigate('/login')}>
                                Sign In
                            </span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
