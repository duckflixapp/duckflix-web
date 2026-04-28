import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, Trash, X } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ROUTES } from '../../../config/routes';
import { api } from '../../../lib/api';
import { ButtonRow, Header, Section } from '../Components';

export default function AccountSettingsPage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [deleting, setDeleting] = useState(false);

    if (!auth?.user) return null;

    const expectedEmail = auth.user.email.toLowerCase();
    const emailMatches = confirmEmail.trim().toLowerCase() === expectedEmail;

    const requestStepUp = () => {
        auth.clearStepUp();
        navigate(ROUTES.routeOf('account.stepup'), {
            state: { scope: 'sensitive:write', returnTo: ROUTES.routeOf('account.settings') },
        });
    };

    const handleDeleteClick = () => {
        if (!auth.hasStepUp()) {
            requestStepUp();
            return;
        }

        setConfirmEmail('');
        setConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        if (deleting) return;
        setConfirmOpen(false);
        setConfirmEmail('');
    };

    const handleDeleteAccount = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!emailMatches || deleting) return;

        setDeleting(true);
        try {
            await api.delete('/account/');
            queryClient.clear();
            toast.success('Account deleted');
            auth.logout();
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                toast('Verification expired', { description: 'Please verify again before deleting your account.' });
                setConfirmOpen(false);
                requestStepUp();
            } else {
                toast.error('Failed to delete account', { description: 'Please try again in a moment.' });
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Header title="Account & Settings" />
            <Section label="Account" desc="Manage your account">
                <ButtonRow
                    icon={Trash}
                    label="Delete account"
                    value="Delete your account data permanently"
                    type="danger"
                    onClick={handleDeleteClick}
                    last
                />
            </Section>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
                        onClick={handleCloseConfirm}
                        aria-label="Close delete account confirmation"
                    />
                    <form
                        onSubmit={handleDeleteAccount}
                        className="relative w-full max-w-md bg-background/60 backdrop-blur-3xl border border-white/7 rounded-3xl sm:rounded-4xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        <div className="flex items-start gap-4 px-5 py-5 border-b border-white/6">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} className="text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-red-400">Delete account</p>
                                <p className="text-xs text-text/45 mt-1 leading-relaxed">
                                    This action permanently deletes your account data. Type your email to confirm.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseConfirm}
                                disabled={deleting}
                                className="p-1.5 rounded-full text-text/35 hover:text-text/70 hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-text/35 px-1">Email</label>
                                <input
                                    value={confirmEmail}
                                    onChange={(event) => setConfirmEmail(event.target.value)}
                                    type="email"
                                    placeholder={auth.user.email}
                                    disabled={deleting}
                                    className={`outline-none text-sm px-4 py-3 rounded-3xl bg-white/5 border transition-colors ${
                                        confirmEmail && !emailMatches ? 'border-red-500/40' : 'border-white/8 focus:border-primary/50'
                                    }`}
                                    autoFocus
                                />
                                {confirmEmail && !emailMatches && <p className="text-xs text-red-400 px-1">Email does not match.</p>}
                            </div>
                        </div>

                        <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-white/6">
                            <button
                                type="button"
                                onClick={handleCloseConfirm}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-3xl text-sm text-text/70 hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!emailMatches || deleting}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-3xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting && <Loader2 size={15} className="animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete account'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
