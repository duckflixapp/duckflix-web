import { useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { RectangleEllipsis } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { AxiosError } from 'axios';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { BackButton } from '../../components/buttons/BackButton';

const schema = z
    .object({
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(64, 'Password must be less than 65 characters')
            .regex(/[a-z]/, 'Must contain one lowercase letter')
            .regex(/[A-Z]/, 'Must contain one uppercase letter')
            .regex(/[^a-zA-Z0-9]/, 'Must contain one special character'),
        confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
        message: 'Passwords do not match',
        path: ['confirm'],
    });

type PasswordFields = z.infer<typeof schema>;

export default function Password() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { clearStepUp } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PasswordFields>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
    });

    const onSubmit = async (data: PasswordFields) => {
        setLoading(true);
        try {
            await api.patch('/account/password', { password: data.password });
            toast.success('Password changed successfully');
            navigate('/account/settings', { replace: true });
        } catch (e) {
            if (e instanceof AxiosError && e.response?.status === 403) {
                clearStepUp();
                toast('Verification expired', { description: 'Please verify again.' });
                navigate('/account/stepup', {
                    state: { scope: 'sensitive:write', returnTo: '/account/settings/password' },
                    replace: true,
                });
            } else toast.error('Failed to change password.', { description: 'Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate('/account/settings');

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/settings" label="Settings" />
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">Security</p>
                <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-white/6">
                    <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <RectangleEllipsis size={15} className="text-white/50" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/85">Change Password</p>
                            <p className="text-xs text-white/40 mt-0.5">Choose a strong, unique password</p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-white/35 px-1">New password</label>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                                className="outline-0 text-sm px-1 py-1.5"
                                autoFocus
                            />
                            {errors.password && <p className="text-xs text-red-400 px-1">{errors.password.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-white/35 px-1">Confirm password</label>
                            <input
                                {...register('confirm')}
                                type="password"
                                placeholder="••••••••"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(onSubmit)()}
                                className="outline-0 text-sm px-1 py-1.5"
                            />
                            {errors.confirm && <p className="text-xs text-red-400 px-1">{errors.confirm.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 my-2 flex items-center justify-end gap-3">
                    <button onClick={handleCancel} className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        className={`px-6 py-2 rounded-3xl text-sm text-background font-medium ${!loading ? 'cursor-pointer bg-primary' : 'bg-primary/75'}`}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
