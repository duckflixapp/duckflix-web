import { useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { RectangleEllipsis } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { AxiosError } from 'axios';

export default function Password() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { clearStepUp } = useAuth();

    const mismatch = confirm.length > 0 && password !== confirm;
    const canSubmit = password.length >= 6 && password === confirm && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            await api.patch('/account/password', { password });
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
            {/* Header */}
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">Security</p>
                <div className="rounded-3xl border border-white/8 bg-white/3 overflow-hidden divide-y divide-white/6">
                    {/* Title row */}
                    <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <RectangleEllipsis size={15} className="text-white/50" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/85">Change Password</p>
                            <p className="text-xs text-white/40 mt-0.5">Choose a strong, unique password</p>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-white/35 px-1">New password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="outline-0 text-sm px-1 py-1.5"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-white/35 px-1">Confirm password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                className={`outline-0 text-sm px-1 py-1.5 ${mismatch ? 'border-red-500/50 focus:border-red-500/50' : ''}`}
                            />
                            {mismatch && <p className="text-xs text-red-400 px-1">Passwords do not match</p>}
                        </div>
                    </div>
                </div>
                {/* Actions */}
                <div className="px-5 py-4 my-2 flex items-center justify-end gap-3">
                    <button onClick={handleCancel} title="Cancel" className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        title="Continue"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`px-6 py-2 rounded-3xl text-sm text-background font-medium ${canSubmit ? 'cursor-pointer bg-primary' : 'bg-primary/75'}`}
                    >
                        {loading ? 'Verifying...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
